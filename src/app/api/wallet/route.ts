import { NextRequest } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { generateId, getOrderGrossTotal } from "@/lib/utils";

try { initDb(); } catch {}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError("Kirish talab etiladi", 401, "UNAUTHORIZED");

  const user = db.$client
    .prepare("SELECT id, role, wallet_balance FROM users WHERE id = ?")
    .get(session.user.id) as { id: string; role: string; wallet_balance: number } | undefined;
  if (!user) return apiError("Foydalanuvchi topilmadi", 404, "NOT_FOUND");

  const tx = db.$client
    .prepare("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50")
    .all(session.user.id);

  return apiSuccess({ balance: user.wallet_balance || 0, role: user.role, transactions: tx });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Kirish talab etiladi", 401, "UNAUTHORIZED");

  const { amount } = (await req.json()) as { amount?: number };
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return apiError("Summa noto'g'ri", 400, "VALIDATION_ERROR");
  }
  if (parsed > 100_000_000) {
    return apiError("Bir martalik to'ldirish limiti oshib ketdi", 400, "LIMIT_ERROR");
  }

  const txId = generateId();
  const tx = db.$client.transaction(() => {
    db.$client.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").run(parsed, session.user.id);
    db.$client
      .prepare("INSERT INTO wallet_transactions (id, user_id, type, amount, status, note) VALUES (?, ?, 'topup', ?, 'success', ?)")
      .run(txId, session.user.id, parsed, "Manual wallet top-up");
    const row = db.$client.prepare("SELECT wallet_balance FROM users WHERE id = ?").get(session.user.id) as { wallet_balance: number };
    return row.wallet_balance || 0;
  });

  return apiSuccess({ balance: tx(), transactionId: txId });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Kirish talab etiladi", 401, "UNAUTHORIZED");

  const { orderId } = (await req.json()) as { orderId?: string };
  if (!orderId) return apiError("orderId majburiy", 400, "VALIDATION_ERROR");

  const order = db.$client
    .prepare("SELECT id, customer_id, total_amount, delivery_fee, platform_fee, payment_status FROM orders WHERE id = ?")
    .get(orderId) as {
      id: string;
      customer_id: string;
      total_amount: number;
      delivery_fee: number | null;
      platform_fee: number | null;
      payment_status: string;
    } | undefined;
  if (!order) return apiError("Buyurtma topilmadi", 404, "NOT_FOUND");
  if (order.payment_status === "paid") return apiError("Buyurtma allaqachon to'langan", 400, "ALREADY_PAID");
  if (order.customer_id !== session.user.id) return apiError("Ruxsat yo'q", 403, "FORBIDDEN");

  const requiredAmount = getOrderGrossTotal(order);
  const existingPaid = db.$client
    .prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE order_id = ? AND status = 'success'")
    .get(orderId) as { s: number };
  const remaining = Math.max(0, requiredAmount - (existingPaid.s || 0));
  if (remaining <= 0) {
    db.$client.prepare("UPDATE orders SET payment_status = 'paid', payment_method = 'wallet' WHERE id = ?").run(orderId);
    return apiSuccess({ paid: true, remaining: 0 });
  }

  const currentUser = db.$client
    .prepare("SELECT wallet_balance FROM users WHERE id = ?")
    .get(session.user.id) as { wallet_balance: number } | undefined;
  if (!currentUser) return apiError("Foydalanuvchi topilmadi", 404, "NOT_FOUND");
  if ((currentUser.wallet_balance || 0) < remaining) {
    return apiError("Hamyonda mablag' yetarli emas", 400, "INSUFFICIENT_FUNDS");
  }

  const paymentId = generateId();
  db.$client.transaction(() => {
    db.$client.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?").run(remaining, session.user.id);
    db.$client
      .prepare("INSERT INTO payments (id, order_id, method, amount, status, transaction_id) VALUES (?, ?, 'wallet', ?, 'success', ?)")
      .run(paymentId, orderId, remaining, `WLT-${Date.now()}`);
    db.$client
      .prepare("INSERT INTO wallet_transactions (id, user_id, type, amount, status, order_id, note) VALUES (?, ?, 'order_payment', ?, 'success', ?, ?)")
      .run(generateId(), session.user.id, -remaining, orderId, "Order payment via wallet");
    db.$client.prepare("UPDATE orders SET payment_status = 'paid', payment_method = 'wallet' WHERE id = ?").run(orderId);
  })();

  const updated = db.$client
    .prepare("SELECT wallet_balance FROM users WHERE id = ?")
    .get(session.user.id) as { wallet_balance: number };

  return apiSuccess({ paid: true, paymentId, balance: updated.wallet_balance || 0 });
}
