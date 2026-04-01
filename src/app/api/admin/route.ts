import { NextRequest } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { generateId, getOrderGrossTotal } from "@/lib/utils";
import { apiError, apiSuccess } from "@/lib/apiResponse";

try { initDb(); } catch {}

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
    }
    const users = db.$client.prepare("SELECT id, name, email, phone, role, created_at, avatar FROM users ORDER BY created_at DESC").all();
    const shops = db.$client
      .prepare(
        `SELECT
          s.*,
          ci.name as city_name,
          (SELECT COUNT(*) FROM products p WHERE p.shop_id = s.id AND p.is_active = 1) as products_count,
          (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id) as orders_count,
          (
            (CASE WHEN COALESCE(s.name, '') <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN COALESCE(s.logo, '') <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN COALESCE(s.working_hours, '') <> '' THEN 1 ELSE 0 END) +
            (CASE WHEN s.location_lat IS NOT NULL AND s.location_lng IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN (SELECT COUNT(*) FROM products p2 WHERE p2.shop_id = s.id AND p2.is_active = 1) >= 3 THEN 1 ELSE 0 END) +
            (CASE WHEN (SELECT COUNT(*) FROM orders o2 WHERE o2.shop_id = s.id) > 0 THEN 1 ELSE 0 END)
          ) as setup_done_steps
         FROM shops s
         LEFT JOIN cities ci ON s.city_id = ci.id
         ORDER BY s.created_at DESC`
      )
      .all()
      .map((shop: any) => ({
        ...shop,
        setup_score: Math.round(((Number(shop.setup_done_steps || 0) / 6) * 100)),
      }));
    const orders = db.$client.prepare(`
      SELECT o.*, u.name as customer_name, s.name as shop_name
      FROM orders o LEFT JOIN users u ON o.customer_id = u.id LEFT JOIN shops s ON o.shop_id = s.id
      ORDER BY o.created_at DESC LIMIT 50
    `).all();
    const payments = db.$client.prepare(`
      SELECT p.*, o.recipient_name, o.recipient_phone
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.method = 'p2p_transfer'
      ORDER BY p.created_at DESC
      LIMIT 100
    `).all();

    const stats = {
      totalUsers: (db.$client.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c,
      totalShops: (db.$client.prepare("SELECT COUNT(*) as c FROM shops").get() as { c: number }).c,
      totalOrders: (db.$client.prepare("SELECT COUNT(*) as c FROM orders").get() as { c: number }).c,
      totalProducts: (db.$client.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number }).c,
      totalRevenue: (db.$client.prepare("SELECT SUM(total_amount) as s FROM orders WHERE payment_status = 'paid'").get() as { s: number }).s || 0,
      totalPlatformFee:
        (db.$client.prepare("SELECT COALESCE(SUM(platform_fee), 0) as s FROM orders").get() as { s: number }).s || 0,
      pendingOrders: (db.$client.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get() as { c: number }).c,
      unverifiedShops: (db.$client.prepare("SELECT COUNT(*) as c FROM shops WHERE is_verified = 0").get() as { c: number }).c,
      pendingP2P: (db.$client.prepare("SELECT COUNT(*) as c FROM payments WHERE method = 'p2p_transfer' AND status = 'pending'").get() as { c: number }).c,
      pendingWithdrawals: (db.$client.prepare("SELECT COUNT(*) as c FROM withdrawals WHERE status = 'pending'").get() as { c: number }).c,
    };

    // Ensure admin_support shop exists
    const supportShop = db.$client.prepare("SELECT id FROM shops WHERE id = 'admin_support'").get();
    if (!supportShop) {
      db.$client
        .prepare(
          `INSERT INTO shops (id, user_id, name, description, is_verified, is_active)
           VALUES (?, ?, ?, ?, 1, 1)`
        )
        .run(
          "admin_support",
          session.user.id,
          "Gift Zone Yordam",
          "Platforma ma'muriyati bilan bog'lanish"
        );
    }

    const supportChats = db.$client.prepare(`
      SELECT c.*, u.name as customer_name, u.email as customer_email, u.avatar as customer_avatar
      FROM chats c
      JOIN users u ON c.customer_id = u.id
      WHERE c.shop_id = 'admin_support'
      ORDER BY c.updated_at DESC
    `).all();

    const withdrawals = db.$client.prepare(`
      SELECT w.*, s.name as shop_name, s.id as shop_id
      FROM withdrawals w
      LEFT JOIN shops s ON w.shop_id = s.id
      ORDER BY w.created_at DESC
    `).all();

    const auditLogs = db.$client.prepare(`
      SELECT l.*, u.name as admin_name, u.email as admin_email
      FROM admin_audit_logs l
      LEFT JOIN users u ON l.admin_user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `).all();

    return apiSuccess({ users, shops, orders, payments, stats, supportChats, withdrawals, auditLogs });
  } catch (e) {
    console.error("ADMIN_GET_ERROR", e);
    return apiError("Xatolik");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
    }
    const { action, type, id } = await req.json();
    let auditNote = "";

    if (type === "shop") {
      if (action === "approve") {
        db.$client.prepare("UPDATE shops SET is_verified = 1, is_active = 1 WHERE id = ?").run(id);
        auditNote = "Do'kon tasdiqlandi";
      }
      if (action === "suspend") {
        db.$client.prepare("UPDATE shops SET is_active = 0 WHERE id = ?").run(id);
        auditNote = "Do'kon bloklandi";
      }
    }
    if (type === "user") {
      if (action === "delete") {
        db.$client.prepare("DELETE FROM users WHERE id = ?").run(id);
        auditNote = "Foydalanuvchi o'chirildi";
      }
    }
    if (type === "product") {
      if (action === "delete") {
        db.$client.prepare("UPDATE products SET is_active = 0 WHERE id = ?").run(id);
        auditNote = "Mahsulot nofaol qilindi";
      }
    }
    if (type === "payment") {
      if (action === "approve") {
        const payment = db.$client.prepare("SELECT order_id, amount FROM payments WHERE id = ?").get(id) as { order_id: string, amount: number };
        if (payment) {
          db.$client.prepare("UPDATE payments SET status = 'success' WHERE id = ?").run(id);
          
          // Check if order is fully paid
          const order = db.$client
            .prepare("SELECT shop_id, total_amount, delivery_fee, platform_fee FROM orders WHERE id = ?")
            .get(payment.order_id) as {
              shop_id: string;
              total_amount: number;
              delivery_fee: number | null;
              platform_fee: number | null;
            } | undefined;
          if (order) {
            const totalRequired = getOrderGrossTotal(order);
            const paidSoFar = db.$client.prepare("SELECT SUM(amount) as s FROM payments WHERE order_id = ? AND status = 'success'").get(payment.order_id) as { s: number };
            
            if (paidSoFar.s >= totalRequired) {
              db.$client.prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?").run(payment.order_id);
              // Add to pending balance only when fully paid
              db.$client.prepare("UPDATE shops SET pending_balance = pending_balance + ? WHERE id = ?").run(order.total_amount, order.shop_id);
            }
          }
          auditNote = "P2P to'lov tasdiqlandi";
        }
      }
    }
    if (type === "withdrawal") {
      if (action === "approve") {
        db.$client.prepare("UPDATE withdrawals SET status = 'completed' WHERE id = ?").run(id);
        auditNote = "Pul yechish so'rovi tasdiqlandi";
      }
      if (action === "reject") {
        // Refund the amount to the shop's balance
        const withdrawal = db.$client.prepare("SELECT shop_id, amount FROM withdrawals WHERE id = ?").get(id) as { shop_id: string, amount: number };
        if (withdrawal) {
          db.$client.prepare("UPDATE withdrawals SET status = 'rejected' WHERE id = ?").run(id);
          db.$client.prepare("UPDATE shops SET balance = balance + ? WHERE id = ?").run(withdrawal.amount, withdrawal.shop_id);
          auditNote = "Pul yechish so'rovi rad etildi";
        }
      }
    }

    if (auditNote) {
      db.$client
        .prepare(
          `INSERT INTO admin_audit_logs
          (id, admin_user_id, action_type, target_type, target_id, note)
          VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
          generateId(),
          session.user.id,
          action || "unknown",
          type || "unknown",
          id || null,
          auditNote
        );
    }

    return apiSuccess({});
  } catch (e) {
    return apiError("Xatolik");
  }
}
