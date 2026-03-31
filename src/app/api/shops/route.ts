import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { generateId, LAUNCH_CITY_NAME } from "@/lib/utils";
import { apiError, apiSuccess } from "@/lib/apiResponse";

try { initDb(); } catch {}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city   = searchParams.get("city");
    const search = searchParams.get("search");
    const limit  = parseInt(searchParams.get("limit") || "100");
    const launchCity = db.$client
      .prepare("SELECT id FROM cities WHERE lower(name) = lower(?) LIMIT 1")
      .get(LAUNCH_CITY_NAME) as { id: number } | undefined;
    const effectiveCity = city || (launchCity ? String(launchCity.id) : "");

    let query = `
      SELECT s.*, ci.name as city_name,
        COUNT(DISTINCT p.id) as products_count,
        COUNT(DISTINCT r.id) as reviews_count
      FROM shops s
      LEFT JOIN cities ci ON s.city_id = ci.id
      LEFT JOIN products p ON s.id = p.shop_id AND p.is_active = 1
      LEFT JOIN reviews r ON r.shop_id = s.id
      WHERE s.is_active = 1
    `;
    const params: (string | number)[] = [];

    if (effectiveCity) { query += " AND s.city_id = ?"; params.push(parseInt(effectiveCity)); }
    if (search) { query += " AND (s.name LIKE ? OR s.description LIKE ?)";    params.push(`%${search}%`, `%${search}%`); }

    query += ` GROUP BY s.id ORDER BY s.rating DESC, reviews_count DESC, products_count DESC, s.created_at DESC LIMIT ${limit}`;

    const shops = db.$client.prepare(query).all(...params);
    return NextResponse.json(
      { success: true, shops },
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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("Ruxsat yo'q", 401, "UNAUTHORIZED");

    const body = await req.json();
    const {
      name, description, phone, telegram, address, workingHours, logo, deliveryFee,
      pickupAvailable, shopDeliveryAvailable, defaultPreparationTime, pickupInstructions, locationLat, locationLng,
    } = body;

    if (!name) return apiError("Do'kon nomi kerak", 400, "VALIDATION_ERROR");

    const pickupFlag = pickupAvailable === false ? 0 : 1;
    const shopDelFlag = shopDeliveryAvailable === false ? 0 : 1;
    const normalizedLat = Number.isFinite(Number(locationLat)) ? Number(locationLat) : null;
    const normalizedLng = Number.isFinite(Number(locationLng)) ? Number(locationLng) : null;

    // Check if shop already exists
    const existing = db.$client.prepare("SELECT id FROM shops WHERE user_id = ?").get(session.user.id) as { id: string } | undefined;
    if (existing) {
      // Update instead
      db.$client.prepare(`
        UPDATE shops SET name=?, description=?, phone=?, telegram=?, city_id=?, address=?, working_hours=?, logo=?, delivery_fee=?,
          pickup_available=?, shop_delivery_available=?, delivery_area_city_ids=?, default_preparation_time=?, pickup_instructions=?,
          location_lat=?, location_lng=?
        WHERE user_id=?
      `).run(name, description || null, phone || null, telegram || null,
             null, address || null, workingHours || null, logo || null,
             deliveryFee || 20000, pickupFlag, shopDelFlag, null,
             defaultPreparationTime || null, pickupInstructions || null,
             normalizedLat, normalizedLng,
             session.user.id);
      return apiSuccess({ shopId: existing.id, updated: true });
    }

    const id = generateId();
    db.$client.prepare(`
      INSERT INTO shops (id, user_id, name, description, phone, telegram, city_id, address, working_hours, logo, delivery_fee,
        pickup_available, shop_delivery_available, delivery_area_city_ids, default_preparation_time, pickup_instructions, location_lat, location_lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, session.user.id, name, description || null, phone || null,
           telegram || null, null, address || null, workingHours || null, logo || null,
           deliveryFee || 20000, pickupFlag, shopDelFlag, null,
           defaultPreparationTime || null, pickupInstructions || null, normalizedLat, normalizedLng);

    return apiSuccess({ shopId: id, created: true });
  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}
