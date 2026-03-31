import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";

try { initDb(); } catch {}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
    }

    // Verify chat ownership (customer or provider)
    const chat = db.$client.prepare(`
      SELECT c.*, s.user_id as provider_user_id
        FROM chats c
        JOIN shops s ON c.shop_id = s.id
        WHERE c.id = ?
    `).get(id) as { customer_id: string, provider_user_id: string } | undefined;

    if (!chat) return NextResponse.json({ error: "Chat topilmadi" }, { status: 404 });
    
    if (chat.customer_id !== session.user.id && chat.provider_user_id !== session.user.id) {
        return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    const messages = db.$client.prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC").all(id);
    
    // Mark messages as read (if they are from the other person)
    db.$client.prepare("UPDATE messages SET is_read = 1 WHERE chat_id = ? AND sender_id != ?").run(id, session.user.id);

    return NextResponse.json({ messages });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Xabar bo'sh bo'lishi mumkin emas" }, { status: 400 });

    const senderId = session.user.id;

    // Insert message
    db.$client.prepare("INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)")
      .run(id, senderId, text);

    // Update chat last message and time
    db.$client.prepare("UPDATE chats SET last_message = ?, updated_at = (datetime('now')) WHERE id = ?")
      .run(text, id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}
