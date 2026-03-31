import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { generateId, LAUNCH_CITY_NAME } from "@/lib/utils";
import { apiError, apiSuccess } from "@/lib/apiResponse";

try { initDb(); } catch {}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const city = searchParams.get("city");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const shopId = searchParams.get("shopId");
    const rating = searchParams.get("rating");
    const ids = searchParams.get("ids");
    const sort = searchParams.get("sort"); // popularity, price_asc, price_desc, rating_desc
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const launchCity = db.$client
      .prepare("SELECT id FROM cities WHERE lower(name) = lower(?) LIMIT 1")
      .get(LAUNCH_CITY_NAME) as { id: number } | undefined;
    const effectiveCity = city || (launchCity ? String(launchCity.id) : "");

    let query = `
      SELECT p.*, 
        s.name as shop_name, s.rating as shop_rating, s.id as shop_id,
        c.name as category_name, c.slug as category_slug,
        sc.name as subcategory_name, sc.slug as subcategory_slug,
        ci.name as city_name,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN shops s ON p.shop_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE p.is_active = 1 AND s.is_active = 1
    `;
    const params: (string | number)[] = [];

    if (category) { query += " AND c.slug = ?"; params.push(category); }
    if (subcategory) { query += " AND sc.slug = ?"; params.push(subcategory); }
    if (effectiveCity) { query += " AND p.city_id = ?"; params.push(parseInt(effectiveCity)); }
    if (minPrice) { query += " AND p.price >= ?"; params.push(parseFloat(minPrice)); }
    if (maxPrice) { query += " AND p.price <= ?"; params.push(parseFloat(maxPrice)); }
    if (rating) { query += " AND p.rating >= ?"; params.push(parseFloat(rating)); }
    if (shopId) { query += " AND p.shop_id = ?"; params.push(shopId); }
    if (ids) {
      const idArray = ids.split(",").filter(Boolean);
      if (idArray.length > 0) {
        query += ` AND p.id IN (${idArray.map(() => "?").join(",")})`;
        params.push(...idArray);
      }
    }
    if (search) {
      query += " AND (p.title LIKE ? OR p.description LIKE ? OR c.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (sort === "price_asc") query += " ORDER BY p.price ASC";
    else if (sort === "price_desc") query += " ORDER BY p.price DESC";
    else if (sort === "rating_desc") query += " ORDER BY p.rating DESC";
    else query += " ORDER BY p.orders_count DESC";

    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const products = db.$client.prepare(query).all(...params);
    return NextResponse.json(
      { success: true, products },
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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== "provider" && session.user.role !== "admin") {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const {
      shopId,
      categoryId,
      subcategoryId,
      title,
      description,
      price,
      stockQty,
      lowStockThreshold,
      preparationTime,
      cityId,
      images,
    } = body;

    if (!shopId || !title || !price || !categoryId) {
      return apiError("Majburiy maydonlar to'ldirilmagan", 400, "VALIDATION_ERROR");
    }

    // Providers can only create products for their own shop
    if (session.user.role === "provider") {
      const shop = db.$client
        .prepare("SELECT id FROM shops WHERE id = ? AND user_id = ?")
        .get(shopId, session.user.id) as { id: string } | undefined;
      if (!shop) {
        return apiError("Forbidden", 403, "FORBIDDEN");
      }
    }

    const parsedPrice = typeof price === "string" ? parseFloat(price) : price;
    if (typeof parsedPrice !== "number" || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return apiError("Narx noto'g'ri", 400, "VALIDATION_ERROR");
    }
    const parsedStockQty = Number(stockQty ?? 0);
    const parsedLowStockThreshold = Number(lowStockThreshold ?? 5);
    if (!Number.isInteger(parsedStockQty) || parsedStockQty < 0) {
      return apiError("Qoldiq noto'g'ri", 400, "VALIDATION_ERROR");
    }
    if (!Number.isInteger(parsedLowStockThreshold) || parsedLowStockThreshold < 0) {
      return apiError("Minimal qoldiq noto'g'ri", 400, "VALIDATION_ERROR");
    }

    const id = generateId();

    db.$client
      .prepare(`INSERT INTO products (id, shop_id, category_id, subcategory_id, title, description, price, stock_qty, low_stock_threshold, preparation_time, city_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        id,
        shopId,
        categoryId || null,
        subcategoryId || null,
        title,
        description || null,
        parsedPrice,
        parsedStockQty,
        parsedLowStockThreshold,
        preparationTime || null,
        cityId || null
      );

    if (images && images.length > 0) {
      const imgStmt = db.$client.prepare(
        "INSERT INTO product_images (product_id, url, is_primary) VALUES (?, ?, ?)"
      );
      images.forEach((url: string, i: number) => imgStmt.run(id, url, i === 0 ? 1 : 0));
    }

    const product = db.$client.prepare("SELECT * FROM products WHERE id = ?").get(id);
    return apiSuccess({ product });
  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}
