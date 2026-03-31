import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/apiResponse";

try { initDb(); } catch {}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = db.$client.prepare(`
      SELECT p.*, 
        s.name as shop_name, s.rating as shop_rating, s.phone as shop_phone,
        s.telegram as shop_telegram, s.working_hours as shop_working_hours,
        s.logo as shop_logo, s.id as shop_id,
        c.name as category_name, c.slug as category_slug,
        sc.name as subcategory_name, sc.slug as subcategory_slug,
        ci.name as city_name
      FROM products p
      LEFT JOIN shops s ON p.shop_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE p.id = ?
    `).get(id);

    if (!product) {
      return apiError("Mahsulot topilmadi", 404, "NOT_FOUND");
    }

    const images = db.$client.prepare("SELECT * FROM product_images WHERE product_id = ?").all(id);
    const reviews = db.$client.prepare(`
      SELECT r.*, u.name as user_name, u.avatar as user_avatar
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC LIMIT 10
    `).all(id);

    // Related products (same category, different id)
    const related = db.$client.prepare(`
      SELECT p.*, pi.url as primary_image,
        COALESCE(AVG(r.rating), 0) as rating,
        COUNT(DISTINCT r.id) as reviews_count,
        s.name as shop_name, c.name as city_name
      FROM products p
      LEFT JOIN (SELECT product_id, url, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY is_primary DESC, id ASC) as rn FROM product_images) pi ON p.id = pi.product_id AND pi.rn = 1
      LEFT JOIN reviews r ON p.id = r.product_id
      LEFT JOIN shops s ON p.shop_id = s.id
      LEFT JOIN cities c ON p.city_id = c.id
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      GROUP BY p.id
      ORDER BY p.rating DESC, p.created_at DESC
      LIMIT 4
    `).all((product as Record<string, any>).category_id, id);

    return NextResponse.json(
      { success: true, product: { ...(product as object), images, reviews, related } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== "provider" && session.user.role !== "admin") {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }

    const { id } = await params;
    const productOwner = db.$client.prepare(`
      SELECT p.id, s.user_id as owner_user_id
      FROM products p
      JOIN shops s ON p.shop_id = s.id
      WHERE p.id = ?
    `).get(id) as { id: string; owner_user_id: string } | undefined;
    if (!productOwner) {
      return apiError("Mahsulot topilmadi", 404, "NOT_FOUND");
    }
    if (
      session.user.role !== "admin" &&
      productOwner.owner_user_id !== session.user.id
    ) {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const {
      title,
      description,
      price,
      stockQty,
      lowStockThreshold,
      preparationTime,
      categoryId,
      subcategoryId,
      cityId,
      isActive,
      images,
    } = body;
    const parsedPrice = Number(price);
    const parsedStockQty = Number(stockQty ?? 0);
    const parsedLowStockThreshold = Number(lowStockThreshold ?? 5);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return apiError("Narx noto'g'ri", 400, "VALIDATION_ERROR");
    }
    if (!Number.isInteger(parsedStockQty) || parsedStockQty < 0) {
      return apiError("Qoldiq noto'g'ri", 400, "VALIDATION_ERROR");
    }
    if (!Number.isInteger(parsedLowStockThreshold) || parsedLowStockThreshold < 0) {
      return apiError("Minimal qoldiq noto'g'ri", 400, "VALIDATION_ERROR");
    }

    db.$client.prepare(`
      UPDATE products SET title = ?, description = ?, price = ?, stock_qty = ?, low_stock_threshold = ?,
        preparation_time = ?, category_id = ?, subcategory_id = ?, city_id = ?, is_active = ?
      WHERE id = ?
    `).run(
      title,
      description,
      parsedPrice,
      parsedStockQty,
      parsedLowStockThreshold,
      preparationTime,
      categoryId || null,
      subcategoryId || null,
      cityId || null,
      isActive ? 1 : 0,
      id
    );

    if (images && Array.isArray(images)) {
      // Very simple sync: remove old and add new
      db.$client.prepare("DELETE FROM product_images WHERE product_id = ?").run(id);
      const imgStmt = db.$client.prepare(
        "INSERT INTO product_images (product_id, url, is_primary) VALUES (?, ?, ?)"
      );
      images.forEach((url: string, i: number) => imgStmt.run(id, url, i === 0 ? 1 : 0));
    }

    return apiSuccess({});
  } catch (e) {
    return apiError("Xatolik");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== "provider" && session.user.role !== "admin") {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }

    const { id } = await params;
    const productOwner = db.$client.prepare(`
      SELECT p.id, s.user_id as owner_user_id
      FROM products p
      JOIN shops s ON p.shop_id = s.id
      WHERE p.id = ?
    `).get(id) as { id: string; owner_user_id: string } | undefined;
    if (!productOwner) {
      return apiError("Mahsulot topilmadi", 404, "NOT_FOUND");
    }
    if (
      session.user.role !== "admin" &&
      productOwner.owner_user_id !== session.user.id
    ) {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }

    db.$client.prepare("UPDATE products SET is_active = 0 WHERE id = ?").run(id);
    return apiSuccess({});
  } catch (e) {
    return apiError("Xatolik");
  }
}
