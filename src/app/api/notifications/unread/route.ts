import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";

try { initDb(); } catch {}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ unreadChats: 0 });

    const userId = session.user.id;

    // Count unread messages in chats where user is involved
    // As customer OR as shop owner
    const unreadCount = db.$client.prepare(`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      LEFT JOIN shops s ON c.shop_id = s.id
      WHERE m.is_read = 0 
      AND m.sender_id != ?
      AND (c.customer_id = ? OR s.user_id = ?)
    `).get(userId, userId, userId) as { count: number };

    return NextResponse.json({ 
      unreadChats: unreadCount?.count || 0 
    });
  } catch (e) {
    console.error("Notifications error:", e);
    return NextResponse.json({ unreadChats: 0 });
  }
}
