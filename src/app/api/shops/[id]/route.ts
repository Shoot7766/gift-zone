import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/apiResponse";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const shop = db.$client.prepare(`
      SELECT s.*, ci.name as city_name
      FROM shops s
      LEFT JOIN cities ci ON s.city_id = ci.id
      WHERE s.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!shop) return apiError("Do'kon topilmadi", 404, "NOT_FOUND");

    // Products
    const products = db.$client.prepare(`
      SELECT p.*, pi.url as primary_image,
        COALESCE(AVG(r.rating), 0) as rating,
        COUNT(DISTINCT r.id) as reviews_count
      FROM products p
      LEFT JOIN (SELECT product_id, url, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY id) as rn FROM product_images) pi ON p.id = pi.product_id AND pi.rn = 1
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.shop_id = ? AND p.is_active = 1
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 20
    `).all(id);

    // Reviews
    const reviews = db.$client.prepare(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.shop_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all(id);

    return NextResponse.json(
      { success: true, shop: { ...shop, products, reviews } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=180, stale-while-revalidate=600",
        },
      }
    );
  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("Ruxsat yo'q", 401, "UNAUTHORIZED");

    const body = await req.json();
    const {
      name, description, phone, telegram, address, workingHours, logo, deliveryFee,
      pickupAvailable, shopDeliveryAvailable, defaultPreparationTime, pickupInstructions, locationLat, locationLng,
    } = body;

    const pickupFlag = pickupAvailable === false ? 0 : 1;
    const shopDelFlag = shopDeliveryAvailable === false ? 0 : 1;
    const normalizedLat = Number.isFinite(Number(locationLat)) ? Number(locationLat) : null;
    const normalizedLng = Number.isFinite(Number(locationLng)) ? Number(locationLng) : null;

    db.$client.prepare(`
      UPDATE shops SET name=?, description=?, phone=?, telegram=?, city_id=?, address=?, working_hours=?, logo=?, delivery_fee=?,
        pickup_available=?, shop_delivery_available=?, delivery_area_city_ids=?, default_preparation_time=?, pickup_instructions=?,
        location_lat=?, location_lng=?
      WHERE id=? AND user_id=?
    `).run(name, description || null, phone || null, telegram || null,
           null, address || null, workingHours || null, logo || null,
           deliveryFee || 20000, pickupFlag, shopDelFlag, null,
           defaultPreparationTime || null, pickupInstructions || null,
           normalizedLat, normalizedLng,
           id, session.user.id);

    return apiSuccess({});
  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}
