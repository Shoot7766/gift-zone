import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { payments, orders } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

try { initDb(); } catch {}

export async function POST(req: NextRequest) {
  const session = await auth();

  try {
    const { orderId, proofImage, paymentId } = await req.json() as {
      orderId?: string;
      proofImage?: string | null;
      paymentId?: string | null;
    };

    if (!orderId) {
      return NextResponse.json({ error: "orderId majburiy" }, { status: 400 });
    }

    const orderData = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!orderData || orderData.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderData[0];
    const isGroupGifting = order.isGroupGifting === true;

    let targetPaymentId: string | null = null;

    if (isGroupGifting && paymentId) {
      const payRow = await db
        .select()
        .from(payments)
        .where(and(eq(payments.id, paymentId), eq(payments.orderId, orderId)))
        .limit(1);
      if (!payRow.length || payRow[0].status !== "pending") {
        return NextResponse.json({ error: "To'lov topilmadi yoki allaqachon qayta ishlangan" }, { status: 400 });
      }
      targetPaymentId = paymentId;
    } else if (
      isGroupGifting &&
      !paymentId &&
      session?.user?.id &&
      order.customerId === session.user.id
    ) {
      const pending = await db
        .select()
        .from(payments)
        .where(and(eq(payments.orderId, orderId), eq(payments.status, "pending")))
        .limit(1);
      if (!pending.length) {
        return NextResponse.json({ error: "Kutilayotgan to'lov topilmadi" }, { status: 404 });
      }
      targetPaymentId = pending[0].id;
    } else if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else if (order.customerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else {
      const first = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);
      if (!first.length) {
        return NextResponse.json({ error: "To'lov yozuvi topilmadi" }, { status: 404 });
      }
      targetPaymentId = first[0].id;
    }

    if (targetPaymentId) {
      await db
        .update(payments)
        .set({
          providerResponse: "claimed_p2p_payment_done",
          proofImage: proofImage || null,
        })
        .where(eq(payments.id, targetPaymentId));
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (botToken && adminChatId) {
      const payerLabel =
        session?.user?.name?.trim() || (isGroupGifting ? "Birgalikda to'lov" : "Noma'lum");
      const msg =
        `🔔 <b>P2P To'lov Tasdig'i Kutilmoqda!</b>\n\n` +
        `Buyurtma ID: #${orderId.substring(0, 8).toUpperCase()}\n` +
        `Xaridor: ${payerLabel}\n` +
        `Summa: ${order.totalAmount?.toLocaleString()} UZS\n` +
        `${proofImage ? "📸 <b>To'lov cheki (screenshot) yuklandi.</b>" : "⚠️ Chek yuklanmadi."}\n\n` +
        `💳 Kartangiz balansini tekshiring va admin panelidan to'lovni qabul qiling!`;

      const payload: any = { chat_id: adminChatId, text: msg, parse_mode: "HTML" };

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
