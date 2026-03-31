import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { generateId } from "@/lib/utils";

try { initDb(); } catch {}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "provider") {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    const shop = db.$client.prepare("SELECT id, balance, pending_balance FROM shops WHERE user_id = ?").get(session.user.id) as { id: string, balance: number, pending_balance: number };
    
    if (!shop) return NextResponse.json({ error: "Do'kon topilmadi" }, { status: 404 });

    const withdrawals = db.$client.prepare("SELECT * FROM withdrawals WHERE shop_id = ? ORDER BY created_at DESC").all(shop.id);

    return NextResponse.json({ 
      balance: shop.balance || 0, 
      pendingBalance: shop.pending_balance || 0,
      withdrawals 
    });
  } catch (e) {
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "provider") {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    const { amount, bankCard, bankName } = await req.json();
    const parsedAmount = Number(amount);
    const normalizedCard = String(bankCard || "").replace(/\s+/g, "");

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !normalizedCard) {
      return NextResponse.json({ error: "Summa va karta raqami majburiy" }, { status: 400 });
    }
    if (!/^\d{16,19}$/.test(normalizedCard)) {
      return NextResponse.json({ error: "Karta raqami noto'g'ri formatda" }, { status: 400 });
    }

    const shop = db.$client.prepare("SELECT id, balance FROM shops WHERE user_id = ?").get(session.user.id) as { id: string, balance: number };
    
    if (!shop) return NextResponse.json({ error: "Do'kon topilmadi" }, { status: 404 });

    if (shop.balance < parsedAmount) {
      return NextResponse.json({ error: "Mablag' yetarli emas" }, { status: 400 });
    }

    const withdrawalId = generateId();

    // Transactional update (since better-sqlite3 in Next.js is synchronous, we can just run them sequentially)
    db.$client.prepare("UPDATE shops SET balance = balance - ? WHERE id = ?").run(parsedAmount, shop.id);
    
    db.$client.prepare(`
      INSERT INTO withdrawals (id, shop_id, amount, status, bank_card, bank_name)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `).run(withdrawalId, shop.id, parsedAmount, normalizedCard, bankName || null);

    return NextResponse.json({ success: true, withdrawalId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}
