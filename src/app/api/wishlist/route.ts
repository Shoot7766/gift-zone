import { NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { savedItems } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

try {
  initDb();
} catch (e) {
  console.log("DB init error in wishlist route:", e);
}

// Get all saved item product IDs for the logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ items: [] });
  }

  try {
    const list = await db.select({ productId: savedItems.productId }).from(savedItems).where(eq(savedItems.userId, session.user.id));
    return NextResponse.json({ items: list.map(i => i.productId) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

// Toggle a saved item
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const existing = await db.select().from(savedItems)
      .where(and(eq(savedItems.userId, session.user.id), eq(savedItems.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      // Remove it
      await db.delete(savedItems).where(eq(savedItems.id, existing[0].id));
      return NextResponse.json({ action: "removed", productId });
    } else {
      // Add it
      await db.insert(savedItems).values({ userId: session.user.id, productId });
      return NextResponse.json({ action: "added", productId });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}
