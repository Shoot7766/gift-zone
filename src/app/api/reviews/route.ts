import { NextRequest } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { apiError, apiSuccess } from "@/lib/apiResponse";

try { initDb(); } catch {}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) return apiError("productId kerak", 400, "VALIDATION_ERROR");

    const reviews = db.$client.prepare(`
      SELECT r.*, u.name as user_name, u.avatar as user_avatar
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(productId);

    return apiSuccess({ reviews });
  } catch (e) {
    return apiError("Xatolik");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError("Kirish kerak", 401, "UNAUTHORIZED");

    const { productId, orderId, rating, comment } = await req.json();

    if (!productId || !rating || rating < 1 || rating > 5) {
      return apiError("Noto'g'ri ma'lumot", 400, "VALIDATION_ERROR");
    }

    // Check if user already reviewed this product for this order
    const existing = db.$client.prepare(
      "SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?"
    ).get(session.user.id, productId, orderId);

    if (existing) {
      return apiError("Siz allaqachon sharh qoldirdingiz", 409, "ALREADY_EXISTS");
    }

    const id = generateId();
    db.$client.prepare(`
      INSERT INTO reviews (id, product_id, user_id, order_id, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, productId, session.user.id, orderId || null, rating, comment || null);

    // Update product's average rating
    const ratingStats = db.$client.prepare(
      "SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE product_id = ?"
    ).get(productId) as { avg: number, cnt: number };

    db.$client.prepare(
      "UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?"
    ).run(Math.round((ratingStats.avg || 0) * 10) / 10, ratingStats.cnt, productId);

    return apiSuccess({ id });
  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}
