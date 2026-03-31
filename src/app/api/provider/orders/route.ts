import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { computePlatformFee } from "@/lib/utils";

try { initDb(); } catch {}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "provider") {
      return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
    }

    const shop = db.$client.prepare("SELECT id FROM shops WHERE user_id = ?").get(session.user.id) as { id: string } | undefined;
    if (!shop) return apiError("Do'kon topilmadi", 404, "NOT_FOUND");

    const orders = db.$client.prepare(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone,
        (SELECT GROUP_CONCAT(p.title, ', ') FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id) as items_title
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE o.shop_id = ?
        AND (o.payment_method = 'cash' OR o.payment_status = 'paid')
      ORDER BY o.created_at DESC
    `).all(shop.id);

    return apiSuccess({ orders });
  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "provider") {
      return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
    }

    const { orderId, status } = await req.json();
    const validStatuses = [
      "accepted",
      "preparing",
      "ready_for_pickup",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!orderId || !validStatuses.includes(status)) {
      return apiError("Noto'g'ri so'rov", 400, "VALIDATION_ERROR");
    }

    const shop = db.$client.prepare("SELECT id FROM shops WHERE user_id = ?").get(session.user.id) as { id: string } | undefined;
    if (!shop) return apiError("Do'kon topilmadi", 404, "NOT_FOUND");

    // Verify order belongs to this shop
    const order = db.$client
      .prepare(
        "SELECT id, shop_id, total_amount, status, payment_status, fulfillment_type FROM orders WHERE id = ? AND shop_id = ?"
      )
      .get(orderId, shop.id) as
      | {
          id: string;
          shop_id: string;
          total_amount: number;
          status: string;
          payment_status: string;
          fulfillment_type: string | null;
        }
      | undefined;
    if (!order) return apiError("Buyurtma topilmadi", 404, "NOT_FOUND");

    const fulfillment = order.fulfillment_type || "shop_delivery";
    if (status === "ready_for_pickup" && fulfillment !== "pickup") {
      return apiError("Bu holat faqat olib ketish buyurtmalari uchun", 400, "VALIDATION_ERROR");
    }
    if (status === "out_for_delivery" && fulfillment !== "shop_delivery") {
      return apiError("Bu holat faqat do'kon yetkazish buyurtmalari uchun", 400, "VALIDATION_ERROR");
    }

    const platformFee = computePlatformFee(order.total_amount);
    const shopPayout = order.total_amount;

    // Paid order delivered: to'liq mahsulot summasi do'kon balansiga (5% mijoz alohida to'lagan)
    if (
      status === "delivered" &&
      order.status !== "delivered" &&
      order.payment_status === "paid"
    ) {
      db.$client
        .prepare(
          "UPDATE shops SET balance = balance + ?, pending_balance = CASE WHEN pending_balance >= ? THEN pending_balance - ? ELSE 0 END WHERE id = ?"
        )
        .run(shopPayout, order.total_amount, order.total_amount, shop.id);
    }

    // Paid order cancelled bo'lsa: pending kamayadi (if previously not delivered/cancelled)
    if (
      status === "cancelled" &&
      order.status !== "cancelled" &&
      order.status !== "delivered" &&
      order.payment_status === "paid"
    ) {
      db.$client
        .prepare(
          "UPDATE shops SET pending_balance = CASE WHEN pending_balance >= ? THEN pending_balance - ? ELSE 0 END WHERE id = ?"
        )
        .run(order.total_amount, order.total_amount, shop.id);
    }

    if (status === "delivered" && order.status !== "delivered") {
      const recordedFee = order.payment_status === "paid" ? platformFee : 0;
      db.$client
        .prepare(
          "UPDATE orders SET status = ?, platform_fee = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .run(status, recordedFee, orderId);
    } else {
      db.$client
        .prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(status, orderId);
    }

    return apiSuccess({ status });
  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}
