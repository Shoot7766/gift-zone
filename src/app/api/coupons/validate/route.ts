import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";

try {
  initDb();
} catch {}

export async function POST(req: NextRequest) {
  try {
    const { shopId, couponCode, subtotal } = await req.json();
    const normalizedCode = String(couponCode || "").trim().toUpperCase();
    const parsedSubtotal = Number(subtotal || 0);

    if (!shopId || !normalizedCode || !Number.isFinite(parsedSubtotal) || parsedSubtotal <= 0) {
      return NextResponse.json({ valid: false, error: "Noto'g'ri so'rov" }, { status: 400 });
    }

    const coupon = db.$client
      .prepare(
        `SELECT *
         FROM coupons
         WHERE shop_id = ? AND code = ? AND is_active = 1
         LIMIT 1`
      )
      .get(shopId, normalizedCode) as
      | {
          id: string;
          discount_type: "percent" | "fixed";
          discount_value: number;
          min_order_amount: number;
          max_discount_amount: number | null;
          usage_limit: number | null;
          used_count: number;
          expires_at: string | null;
        }
      | undefined;

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Kupon topilmadi" }, { status: 404 });
    }

    const notExpired =
      !coupon.expires_at || new Date(coupon.expires_at).getTime() > Date.now();
    if (!notExpired) {
      return NextResponse.json({ valid: false, error: "Kupon muddati tugagan" }, { status: 400 });
    }

    const underUsageLimit =
      coupon.usage_limit == null || coupon.used_count < coupon.usage_limit;
    if (!underUsageLimit) {
      return NextResponse.json({ valid: false, error: "Kupon limiti tugagan" }, { status: 400 });
    }

    const minAmount = coupon.min_order_amount || 0;
    if (parsedSubtotal < minAmount) {
      return NextResponse.json(
        { valid: false, error: `Minimal buyurtma summasi: ${Math.round(minAmount)} so'm` },
        { status: 400 }
      );
    }

    let discountAmount =
      coupon.discount_type === "percent"
        ? (parsedSubtotal * coupon.discount_value) / 100
        : coupon.discount_value;

    if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
      discountAmount = coupon.max_discount_amount;
    }
    if (discountAmount > parsedSubtotal) discountAmount = parsedSubtotal;

    return NextResponse.json({
      valid: true,
      discountAmount,
      code: normalizedCode,
    });
  } catch (e) {
    return NextResponse.json({ valid: false, error: "Xatolik" }, { status: 500 });
  }
}

