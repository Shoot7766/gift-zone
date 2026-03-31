import { NextRequest } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { generateId, getOrderGrossTotal } from "@/lib/utils";

try { initDb(); } catch {}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Kirish talab etiladi", 401, "UNAUTHORIZED");

  const { orderId, amount } = (await req.json()) as { orderId?: string; amount?: number };
  if (!orderId) return apiError("orderId majburiy", 400, "VALIDATION_ERROR");
  const contribution = Number(amount);
  if (!Number.isFinite(contribution) || contribution <= 0) {
    return apiError("Summa noto'g'ri", 400, "VALIDATION_ERROR");
  }

  const order = db.$client
    .prepare("SELECT id, total_amount, delivery_fee, platform_fee, payment_status, is_group_gifting FROM orders WHERE id = ?")
    .get(orderId) as {
      id: string;
      total_amount: number;
      delivery_fee: number | null;
      platform_fee: number | null;
      payment_status: string;
      is_group_gifting: number;
    } | undefined;
  if (!order) return apiError("Buyurtma topilmadi", 404, "NOT_FOUND");
  if (order.is_group_gifting !== 1) return apiError("Bu buyurtma birgalikda to'lov emas", 400, "NOT_GROUP_ORDER");
  if (order.payment_status === "paid") return apiError("Buyurtma allaqachon to'langan", 400, "ALREADY_PAID");

  const totalRequired = getOrderGrossTotal(order);
  const paid = db.$client
    .prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE order_id = ? AND status = 'success'")
    .get(orderId) as { s: number };
  const remaining = Math.max(0, totalRequired - (paid.s || 0));
  const deduct = Math.min(remaining, contribution);
  if (deduct <= 0) return apiError("Qolgan summa yo'q", 400, "NO_REMAINING");

  const user = db.$client.prepare("SELECT wallet_balance FROM users WHERE id = ?").get(session.user.id) as { wallet_balance: number } | undefined;
  if (!user || (user.wallet_balance || 0) < deduct) {
    return apiError("Hamyonda mablag' yetarli emas", 400, "INSUFFICIENT_FUNDS");
  }

  const paymentId = generateId();
  db.$client.transaction(() => {
    db.$client.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?").run(deduct, session.user.id);
    db.$client
      .prepare("INSERT INTO payments (id, order_id, method, amount, status, transaction_id, provider_response) VALUES (?, ?, 'wallet', ?, 'success', ?, ?)")
      .run(paymentId, orderId, deduct, `WLT-G-${Date.now()}`, `wallet:${session.user.id}`);
    db.$client
      .prepare("INSERT INTO wallet_transactions (id, user_id, type, amount, status, order_id, note) VALUES (?, ?, 'order_payment', ?, 'success', ?, ?)")
      .run(generateId(), session.user.id, -deduct, orderId, "Group gifting contribution via wallet");
  })();

  const paidAfter = db.$client
    .prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE order_id = ? AND status = 'success'")
    .get(orderId) as { s: number };
  if (paidAfter.s >= totalRequired) {
    db.$client.prepare("UPDATE orders SET payment_status = 'paid', payment_method = 'wallet' WHERE id = ?").run(orderId);
  }

  return apiSuccess({ paymentId, paidAmount: deduct, remaining: Math.max(0, totalRequired - paidAfter.s) });
}
