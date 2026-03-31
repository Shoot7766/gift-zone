import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "provider") {
      return apiError("Ruxsat yo'q", 401, "UNAUTHORIZED");
    }

    // Get the provider's shop
    const shop = db.$client.prepare("SELECT id FROM shops WHERE user_id = ?").get(session.user.id) as { id: string } | undefined;
    if (!shop) {
      return apiError("Do'kon topilmadi", 404, "NOT_FOUND");
    }

    // Orders summary
    const orders = db.$client.prepare(`
      SELECT o.id, o.status, o.total_amount, o.delivery_fee, o.created_at, oi.product_id, oi.title, oi.price, oi.quantity
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.shop_id = ?
    `).all(shop.id) as any[];

    // Calculate revenue last 7 days chart array
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0]; // YYYY-MM-DD
    });

    const revenueMap: Record<string, number> = {};
    const ordersCountMap: Record<string, number> = {};
    last7Days.forEach(date => {
      revenueMap[date] = 0;
      ordersCountMap[date] = 0;
    });

    let totalRevenue = 0;
    let pendingCount = 0;
    let deliveredCount = 0;

    const topProductsMap: Record<string, { title: string, qty: number, revenue: number }> = {};

    const uniqueOrderIds = new Set<string>();

    orders.forEach(o => {
      const date = o.created_at.split(" ")[0]; // Assuming YYYY-MM-DD HH:MM:SS format
      if (revenueMap[date] !== undefined) {
          if (!uniqueOrderIds.has(o.id)) {
             revenueMap[date] += o.total_amount;
             ordersCountMap[date] += 1;
          }
      }

      if (!uniqueOrderIds.has(o.id)) {
        uniqueOrderIds.add(o.id);
        totalRevenue += o.total_amount;
        if (o.status === "pending") pendingCount++;
        if (o.status === "delivered") deliveredCount++;
      }

      // Top products
      if (o.product_id) {
        if (!topProductsMap[o.product_id]) {
          topProductsMap[o.product_id] = { title: o.title, qty: 0, revenue: 0 };
        }
        topProductsMap[o.product_id].qty += o.quantity;
        topProductsMap[o.product_id].revenue += o.price * o.quantity;
      }
    });

    const chartData = last7Days.map(date => ({
      date: date.slice(5), // MM-DD
      daromad: revenueMap[date],
      buyurtmalar: ordersCountMap[date]
    }));

    const topProducts = Object.values(topProductsMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const funnelRows = db.$client
      .prepare(
        `SELECT status, COUNT(*) as count
         FROM orders
         WHERE shop_id = ?
         GROUP BY status`
      )
      .all(shop.id) as Array<{ status: string; count: number }>;
    const funnel = {
      pending: 0,
      accepted: 0,
      preparing: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };
    funnelRows.forEach((row) => {
      if (Object.prototype.hasOwnProperty.call(funnel, row.status)) {
        (funnel as Record<string, number>)[row.status] = row.count;
      }
    });

    const lowStockProducts = db.$client
      .prepare(
        `SELECT id, title, stock_qty, low_stock_threshold
         FROM products
         WHERE shop_id = ?
           AND is_active = 1
           AND stock_qty <= low_stock_threshold
         ORDER BY stock_qty ASC
         LIMIT 8`
      )
      .all(shop.id);

    const activeCouponsCountRow = db.$client
      .prepare(
        `SELECT COUNT(*) as count
         FROM coupons
         WHERE shop_id = ? AND is_active = 1`
      )
      .get(shop.id) as { count: number };

    return apiSuccess({
      chartData,
      stats: {
        totalRevenue,
        ordersCount: uniqueOrderIds.size,
        pendingCount,
        deliveredCount,
        activeCouponsCount: activeCouponsCountRow?.count || 0,
      },
      topProducts,
      funnel,
      lowStockProducts,
    });

  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}
