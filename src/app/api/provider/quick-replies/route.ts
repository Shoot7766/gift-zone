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
    const quickReplies = db.$client
      .prepare("SELECT * FROM quick_replies WHERE shop_id = ? ORDER BY created_at DESC")
      .all(shopId);
    return apiSuccess({ quickReplies });
  } catch {
    return apiError("Xatolik");
  }
}

export async function POST(req: NextRequest) {
  try {
    const shopId = await getProviderShopId();
    if (!shopId) return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
    const { title, message } = await req.json();
    if (!title || !message) {
      return apiError("Sarlavha va matn kerak", 400, "VALIDATION_ERROR");
    }
    db.$client
      .prepare("INSERT INTO quick_replies (id, shop_id, title, message) VALUES (?, ?, ?, ?)")
      .run(generateId(), shopId, String(title).trim(), String(message).trim());
    return apiSuccess({});
  } catch {
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
      .prepare("DELETE FROM quick_replies WHERE id = ? AND shop_id = ?")
      .run(id, shopId);
    return apiSuccess({});
  } catch {
    return apiError("Xatolik");
  }
}

