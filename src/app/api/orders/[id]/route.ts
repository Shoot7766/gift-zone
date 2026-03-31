import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { computePlatformFee } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth();

    const order = db.$client.prepare(`
      SELECT o.*, s.name as shop_name, ci.name as city_name,
        u.name as customer_name
      FROM orders o
      LEFT JOIN shops s ON o.shop_id = s.id
      LEFT JOIN cities ci ON o.delivery_city_id = ci.id
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE o.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!order) return apiError("Buyurtma topilmadi", 404, "NOT_FOUND");

    const isGroupGifting =
      order.is_group_gifting === 1 ||
      order.is_group_gifting === true ||
      order.is_group_gifting === "1";

    /** Birgalikda to'lov: havola orqali kirganlar (login bo'lmasa ham) buyurtmani ko'rishi kerak */
    if (isGroupGifting) {
      const items = db.$client.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);
      const payments = db.$client.prepare("SELECT * FROM payments WHERE order_id = ?").all(id);
      return apiSuccess({ order: { ...order, items, payments } });
    }

    if (!session) return apiError("Kirish talab etiladi", 401, "UNAUTHORIZED");

    const orderMeta = order as { customer_id: string; shop_id: string };
    const isAdmin = session.user.role === "admin";
    const isCustomerOwner = session.user.role === "customer" && orderMeta.customer_id === session.user.id;
    let isProviderOwner = false;

    if (session.user.role === "provider") {
      const shop = db.$client
        .prepare("SELECT id FROM shops WHERE id = ? AND user_id = ?")
        .get(orderMeta.shop_id, session.user.id) as { id: string } | undefined;
      isProviderOwner = !!shop;
    }

    if (!isAdmin && !isCustomerOwner && !isProviderOwner) {
      return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
    }

    const items = db.$client.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);
    const payments = db.$client.prepare("SELECT * FROM payments WHERE order_id = ?").all(id);

    return apiSuccess({ order: { ...order, items, payments } });
  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return apiError("Kirish talab etiladi", 401, "UNAUTHORIZED");
    if (session.user.role !== "provider" && session.user.role !== "admin") {
      return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const { status: newStatus } = body;

    const VALID_STATUSES = [
      "pending",
      "accepted",
      "preparing",
      "ready_for_pickup",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];
    if (!VALID_STATUSES.includes(newStatus)) {
      return apiError("Noto'g'ri holat", 400, "VALIDATION_ERROR");
    }

    // Money flow handle [NEW]
    const orderData = db.$client
      .prepare(
        "SELECT status, shop_id, total_amount, payment_status, fulfillment_type FROM orders WHERE id = ?"
      )
      .get(id) as
      | {
          status: string;
          shop_id: string;
          total_amount: number;
          payment_status: string;
          fulfillment_type: string | null;
        }
      | undefined;
    if (!orderData) {
      return apiError("Buyurtma topilmadi", 404, "NOT_FOUND");
    }

    if (session.user.role === "provider") {
      const shop = db.$client
        .prepare("SELECT id FROM shops WHERE id = ? AND user_id = ?")
        .get(orderData.shop_id, session.user.id) as { id: string } | undefined;
      if (!shop) {
        return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
      }
    }

    const fulfillment = orderData.fulfillment_type || "shop_delivery";
    if (newStatus === "ready_for_pickup" && fulfillment !== "pickup") {
      return apiError("Bu holat faqat olib ketish buyurtmalari uchun", 400, "VALIDATION_ERROR");
    }
    if (newStatus === "out_for_delivery" && fulfillment !== "shop_delivery") {
      return apiError("Bu holat faqat do'kon yetkazish buyurtmalari uchun", 400, "VALIDATION_ERROR");
    }

    const platformFee = computePlatformFee(orderData.total_amount);
    /** Mijoz 5% ni alohida to'lagan; do'kon to'liq mahsulot summasini oladi */
    const shopPayout = orderData.total_amount;

    // Moving pending → balance: to'liq mahsulot summasi do'kon balansiga
    if (
      newStatus === "delivered" &&
      orderData.status !== "delivered" &&
      orderData.payment_status === "paid"
    ) {
      db.$client
        .prepare(
          "UPDATE shops SET balance = balance + ?, pending_balance = CASE WHEN pending_balance >= ? THEN pending_balance - ? ELSE 0 END WHERE id = ?"
        )
        .run(shopPayout, orderData.total_amount, orderData.total_amount, orderData.shop_id);
    }
    
    // Handle cancellation (money back from pending) for paid, non-delivered orders
    if (
      newStatus === "cancelled" &&
      orderData.status !== "cancelled" &&
      orderData.status !== "delivered" &&
      orderData.payment_status === "paid"
    ) {
      db.$client
        .prepare(
          "UPDATE shops SET pending_balance = CASE WHEN pending_balance >= ? THEN pending_balance - ? ELSE 0 END WHERE id = ?"
        )
        .run(orderData.total_amount, orderData.total_amount, orderData.shop_id);
    }

    if (newStatus === "delivered" && orderData.status !== "delivered") {
      const recordedFee = orderData.payment_status === "paid" ? platformFee : 0;
      db.$client
        .prepare(
          "UPDATE orders SET status = ?, platform_fee = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .run(newStatus, recordedFee, id);
    } else {
      db.$client
        .prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(newStatus, id);
    }

    return apiSuccess({ status: newStatus });
  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}
