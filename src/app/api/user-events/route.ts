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

    const events = db.$client.prepare("SELECT * FROM user_events WHERE user_id = ? ORDER BY date ASC")
      .all(session.user.id);

    // For each event, get linked products
    const eventsWithGifts = events.map((event: any) => {
      const gifts = db.$client.prepare(`
        SELECT p.*, pi.url as image_url
        FROM event_gifts eg
        JOIN products p ON eg.product_id = p.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
        WHERE eg.event_id = ?
      `).all(event.id);
      return { ...event, gifts };
    });

    return NextResponse.json({ events: eventsWithGifts });
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

    const reqBody = await req.json();
    
    if (reqBody.existingEventId) {
      db.$client.prepare("INSERT INTO event_gifts (event_id, product_id) VALUES (?, ?)")
        .run(reqBody.existingEventId, reqBody.productId);
      return NextResponse.json({ success: true });
    }

    const { name, date, reminderDays, isRecurring, productId } = reqBody;
    if (!name || !date) {
      return NextResponse.json({ error: "Nom va sana kiritish shart" }, { status: 400 });
    }

    const id = generateId();
    
    db.$client.prepare(`
      INSERT INTO user_events (id, user_id, name, date, reminder_days, is_recurring)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, session.user.id, name, date, reminderDays || 7, isRecurring ? 1 : 0);

    if (productId) {
      db.$client.prepare("INSERT INTO event_gifts (event_id, product_id) VALUES (?, ?)")
        .run(id, productId);
    }

    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID topilmadi" }, { status: 400 });

    db.$client.prepare("DELETE FROM user_events WHERE id = ? AND user_id = ?")
      .run(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}
