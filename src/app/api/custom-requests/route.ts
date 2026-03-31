import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { generateId, formatPrice } from "@/lib/utils";
import { sendTelegramMessage } from "@/lib/telegram";

try { initDb(); } catch {}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Kirish kerak" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    let query = `
      SELECT cr.*, 
        u.name as customer_name, u.phone as customer_phone,
        s.name as shop_name, ci.name as city_name
      FROM custom_requests cr
      LEFT JOIN users u ON cr.customer_id = u.id
      LEFT JOIN shops s ON cr.shop_id = s.id
      LEFT JOIN cities ci ON cr.city_id = ci.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (session.user.role === "customer") {
      query += " AND cr.customer_id = ?"; params.push(session.user.id);
    } else if (session.user.role === "provider" && shopId) {
      query += " AND cr.shop_id = ?"; params.push(shopId);
    }

    query += " ORDER BY cr.created_at DESC";
    const requests = db.$client.prepare(query).all(...params);
    return NextResponse.json({ requests });
  } catch (e) {
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Kirish kerak" }, { status: 401 });

    const body = await req.json();
    const { shopId, description, referenceImage, budget, deliveryDate, deliveryAddress, cityId } = body;

    if (!description) return NextResponse.json({ error: "Tavsif kerak" }, { status: 400 });

    const id = generateId();
    db.$client.prepare(`
      INSERT INTO custom_requests (id, customer_id, shop_id, description, reference_image, 
        budget, delivery_date, delivery_address, city_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, session.user.id, shopId || null, description, referenceImage || null,
      budget || null, deliveryDate || null, deliveryAddress || null, cityId || null);

    // Send Telegram Notification
    try {
      const shop = shopId ? db.$client.prepare("SELECT name FROM shops WHERE id = ?").get(shopId) as { name: string } : null;
      const message = `
<b>✨ Yangi shaxsiy sovg'a so'rovi!</b>
ID: <code>#${id.slice(-8).toUpperCase()}</code>
Do'kon: <b>${shop?.name || "Barcha do'konlar"}</b>
Mijoz: <b>${session.user.name}</b>
Tavsif: <i>${description.slice(0, 100)}${description.length > 100 ? "..." : ""}</i>
Byudjet: ${budget ? formatPrice(budget) : "Kelishilgan holda"}
      `;
      sendTelegramMessage(message);
    } catch (err) {
      console.error("Notify error:", err);
    }

    return NextResponse.json({ id, success: true });
  } catch (e) {
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "provider") {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    const { id, status, providerResponse, quotedPrice } = await req.json();
    db.$client.prepare(`
      UPDATE custom_requests SET status = ?, provider_response = ?, quoted_price = ?
      WHERE id = ?
    `).run(status, providerResponse || null, quotedPrice || null, id);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}
