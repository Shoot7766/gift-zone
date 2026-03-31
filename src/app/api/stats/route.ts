import { NextResponse } from "next/server";
import { db } from "@/db";
import { shops, products, orders, reviews } from "@/db/schema";
import { count, sql } from "drizzle-orm";
import { LAUNCH_CITY_LABEL, LAUNCH_CITY_NAME } from "@/lib/utils";

export async function GET() {
  try {
    const launchCity = db.$client
      .prepare("SELECT id FROM cities WHERE lower(name) = lower(?) LIMIT 1")
      .get(LAUNCH_CITY_NAME) as { id: number } | undefined;
    const cityId = launchCity?.id;

    const shopsCountRes = cityId
      ? [{ value: (db.$client.prepare("SELECT COUNT(*) as c FROM shops WHERE city_id = ? AND is_active = 1").get(cityId) as { c: number }).c }]
      : await db.select({ value: count() }).from(shops);
    const productsCountRes = cityId
      ? [{ value: (db.$client.prepare("SELECT COUNT(*) as c FROM products WHERE city_id = ? AND is_active = 1").get(cityId) as { c: number }).c }]
      : await db.select({ value: count() }).from(products);
    const ordersCountRes = await db.select({ value: count() }).from(orders);
    
    // Average rating
    const avgRatingRes = await db.select({ 
      avg: sql<number>`avg(${reviews.rating})` 
    }).from(reviews);

    const stats = {
      shops: shopsCountRes[0]?.value || 0,
      gifts: productsCountRes[0]?.value || 0,
      orders: ordersCountRes[0]?.value || 0,
      rating: Number(avgRatingRes[0]?.avg || 4.9).toFixed(1),
      cityLabel: LAUNCH_CITY_LABEL,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
