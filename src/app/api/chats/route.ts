import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { generateId } from "@/lib/utils";

try { initDb(); } catch {}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
    }

    const { user } = session;
    let chats;

    if (user.role === "admin") {
      // Admin sees support chats
      chats = db.$client.prepare(`
        SELECT c.*, u.name as customer_name, u.avatar as customer_avatar
        FROM chats c
        JOIN users u ON c.customer_id = u.id
        WHERE c.shop_id = 'admin_support'
        ORDER BY c.updated_at DESC
      `).all();
    } else if (user.role === "provider") {
      // Get the shop belonging to this provider
      const shop = db.$client.prepare("SELECT id FROM shops WHERE user_id = ?").get(user.id) as { id: string } | undefined;
      if (!shop) return NextResponse.json({ chats: [] });

      chats = db.$client.prepare(`
        SELECT c.*, u.name as customer_name, u.avatar as customer_avatar
        FROM chats c
        JOIN users u ON c.customer_id = u.id
        WHERE c.shop_id = ?
        ORDER BY c.updated_at DESC
      `).all(shop.id);
    } else {
      // Customer view
      chats = db.$client.prepare(`
        SELECT c.*, s.name as shop_name, s.logo as shop_logo
        FROM chats c
        JOIN shops s ON c.shop_id = s.id
        WHERE c.customer_id = ?
        ORDER BY c.updated_at DESC
      `).all(user.id);
    }

    return NextResponse.json({ chats });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
    }

    const { shopId } = await req.json();
    if (!shopId) return NextResponse.json({ error: "Shop ID kerak" }, { status: 400 });

    const customerId = session.user.id;

    // Check if chat already exists
    let chat = db.$client.prepare("SELECT * FROM chats WHERE customer_id = ? AND shop_id = ?")
      .get(customerId, shopId) as { id: string } | undefined;

    if (!chat) {
      const id = generateId();
      db.$client.prepare("INSERT INTO chats (id, customer_id, shop_id) VALUES (?, ?, ?)")
        .run(id, customerId, shopId);
      chat = { id };
    }

    return NextResponse.json({ chat });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}
