import { NextRequest } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { apiError, apiSuccess } from "@/lib/apiResponse";

try {
  initDb();
} catch {}

async function getProviderShopId() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "provider") return null;
  const shop = db.$client
    .prepare("SELECT id FROM shops WHERE user_id = ?")
    .get(session.user.id) as { id: string } | undefined;
  return shop?.id || null;
}

export async function GET() {
  try {
    const shopId = await getProviderShopId();
    if (!shopId) return apiError("Ruxsat yo'q", 403, "FORBIDDEN");

    const coupons = db.$client
      .prepare("SELECT * FROM coupons WHERE shop_id = ? ORDER BY created_at DESC")
      .all(shopId);
    return apiSuccess({ coupons });
  } catch (e) {
    return apiError("Xatolik");
  }
}

export async function POST(req: NextRequest) {
  try {
    const shopId = await getProviderShopId();
    if (!shopId) return apiError("Ruxsat yo'q", 403, "FORBIDDEN");

    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const discountType = body.discountType === "fixed" ? "fixed" : "percent";
    const discountValue = Number(body.discountValue || 0);
    const minOrderAmount = Number(body.minOrderAmount || 0);
    const maxDiscountAmount = body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null;
    const usageLimit = body.usageLimit ? Number(body.usageLimit) : null;
    const expiresAt = body.expiresAt ? String(body.expiresAt) : null;

    if (!code || !/^[A-Z0-9_-]{3,20}$/.test(code)) {
      return apiError("Promo kod noto'g'ri formatda", 400, "VALIDATION_ERROR");
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return apiError("Chegirma qiymati noto'g'ri", 400, "VALIDATION_ERROR");
    }
    if (discountType === "percent" && discountValue > 100) {
      return apiError("Foiz 100 dan katta bo'lishi mumkin emas", 400, "VALIDATION_ERROR");
    }

    const id = generateId();
    db.$client
      .prepare(
        `INSERT INTO coupons
        (id, shop_id, code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, is_active, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
      )
      .run(
        id,
        shopId,
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        expiresAt
      );

    return apiSuccess({ id });
  } catch (e) {
    return apiError("Xatolik");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const shopId = await getProviderShopId();
    if (!shopId) return apiError("Ruxsat yo'q", 403, "FORBIDDEN");

    const { id, isActive } = await req.json();
    if (!id) return apiError("ID kerak", 400, "VALIDATION_ERROR");
    db.$client
      .prepare("UPDATE coupons SET is_active = ? WHERE id = ? AND shop_id = ?")
      .run(isActive ? 1 : 0, id, shopId);
    return apiSuccess({});
  } catch (e) {
    return apiError("Xatolik");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const shopId = await getProviderShopId();
    if (!shopId) return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return apiError("ID kerak", 400, "VALIDATION_ERROR");
    db.$client
      .prepare("DELETE FROM coupons WHERE id = ? AND shop_id = ?")
      .run(id, shopId);
    return apiSuccess({});
  } catch (e) {
    return apiError("Xatolik");
  }
}

