import { NextRequest } from "next/server";
import { db, initDb } from "@/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { generateId, getOrderGrossTotal } from "@/lib/utils";

try { initDb(); } catch {}

// Initiate payment (mock + stubs for Click/Payme/Uzum)
export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(
      `payments:init:${getClientIp(req)}`,
      40,
      10 * 60 * 1000
    );
    if (!rate.ok) {
      return apiError(
        "Juda ko'p to'lov urinishlari. Keyinroq qayta urinib ko'ring.",
        429,
        "RATE_LIMIT"
      );
    }

    const { orderId, method, amount, isGroupGifting } = await req.json();

    if (!orderId || !method || !amount) {
      return apiError("Majburiy maydonlar yo'q", 400, "VALIDATION_ERROR");
    }

    // For admin/provider convenience, payment number is same as order number (unless group gifting)
    const paymentId = isGroupGifting ? generateId() : orderId;

    // In production: integrate with real payment gateway
    // Click: https://api.click.uz/v2/merchant/payment/prepare
    // Payme: https://checkout.paycom.uz
    // Uzum: https://api.uzum.uz/pay

    // Mock: immediately simulate success for demo
    let redirectUrl = "";
    let transactionId = "";

    if (method === "click") {
      transactionId = "CLK" + Date.now();
      redirectUrl = `/payment/processing?orderId=${orderId}&paymentId=${paymentId}&method=click`;
    } else if (method === "payme") {
      transactionId = "PME" + Date.now();
      redirectUrl = `/payment/processing?orderId=${orderId}&paymentId=${paymentId}&method=payme`;
    } else if (method === "uzum") {
      transactionId = "UZM" + Date.now();
      redirectUrl = `/payment/processing?orderId=${orderId}&paymentId=${paymentId}&method=uzum`;
    } else if (method === "p2p_transfer") {
      transactionId = "P2P" + Date.now();
      db.$client
        .prepare(`UPDATE orders SET payment_method = 'p2p_transfer' WHERE id = ?`)
        .run(orderId);
      if (!isGroupGifting) {
        db.$client.prepare("DELETE FROM payments WHERE order_id = ?").run(orderId);
      }
      db.$client
        .prepare(`
          INSERT INTO payments (id, order_id, method, amount, status, transaction_id)
          VALUES (?, ?, 'p2p_transfer', ?, 'pending', ?)
        `)
        .run(paymentId, orderId, amount, transactionId);
      return apiSuccess({ method: "p2p_transfer", orderId, paymentId });
    } else {
      // Cash payment
      transactionId = "CSH" + Date.now();
      // Mark order as unpaid but confirmed
      db.$client.prepare(`UPDATE orders SET payment_method = 'cash' WHERE id = ?`).run(orderId);
      if (!isGroupGifting) {
        db.$client.prepare("DELETE FROM payments WHERE order_id = ?").run(orderId);
      }
      db.$client.prepare(`
        INSERT INTO payments (id, order_id, method, amount, status, transaction_id)
        VALUES (?, ?, 'cash', ?, 'pending', ?)
      `).run(paymentId, orderId, amount, transactionId);
      return apiSuccess({ method: "cash", orderId });
    }

    if (!isGroupGifting) {
      db.$client.prepare("DELETE FROM payments WHERE order_id = ?").run(orderId);
    }
    db.$client.prepare(`
      INSERT INTO payments (id, order_id, method, amount, status, transaction_id)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(paymentId, orderId, method, amount, transactionId);

    return apiSuccess({ redirectUrl, paymentId });
  } catch (e) {
    console.error(e);
    return apiError("To'lov xatoligi");
  }
}

// Confirm payment (webhook / callback)
export async function PATCH(req: NextRequest) {
  try {
    const rate = checkRateLimit(
      `payments:webhook:${getClientIp(req)}`,
      120,
      60 * 1000
    );
    if (!rate.ok) {
      return apiError("Too many webhook requests", 429, "RATE_LIMIT");
    }

    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return apiError("Webhook secret is not configured", 500, "WEBHOOK_CONFIG_ERROR");
    }

    const incomingSecret = req.headers.get("x-payment-webhook-secret");
    if (!incomingSecret || incomingSecret !== webhookSecret) {
      return apiError("Unauthorized webhook", 401, "UNAUTHORIZED");
    }

    const { paymentId, orderId, status } = await req.json();
    if (!paymentId || !orderId || (status !== "success" && status !== "failed")) {
      return apiError("Invalid payload", 400, "VALIDATION_ERROR");
    }

    const payment = db.$client
      .prepare("SELECT id, order_id, amount FROM payments WHERE id = ?")
      .get(paymentId) as { id: string; order_id: string; amount: number } | undefined;
    if (!payment || payment.order_id !== orderId) {
      return apiError("Payment not found", 404, "NOT_FOUND");
    }

    if (status === "success") {
      db.$client.prepare(`UPDATE payments SET status = 'success' WHERE id = ?`).run(paymentId);
      
      // Check if order is fully paid (for group gifting)
      const order = db.$client
        .prepare("SELECT total_amount, delivery_fee, platform_fee, is_group_gifting FROM orders WHERE id = ?")
        .get(orderId) as {
          total_amount: number;
          delivery_fee: number | null;
          platform_fee: number | null;
          is_group_gifting: number;
        } | undefined;
      if (order) {
        const totalRequired = getOrderGrossTotal(order);
        const paidSoFar = db.$client.prepare("SELECT SUM(amount) as s FROM payments WHERE order_id = ? AND status = 'success'").get(orderId) as { s: number };
        
        if (paidSoFar.s >= totalRequired) {
          db.$client.prepare(`
            UPDATE orders SET payment_status = 'paid', payment_transaction_id = ?, 
              updated_at = datetime('now') WHERE id = ?
          `).run(paymentId, orderId);
        }
      }
    } else {
      db.$client.prepare(`UPDATE payments SET status = 'failed' WHERE id = ?`).run(paymentId);
    }

    return apiSuccess({});
  } catch (e) {
    return apiError("Xatolik");
  }
}
