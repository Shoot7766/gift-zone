import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { initDb } from "@/db";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { userStore } from "@/lib/userStore";

try {
  initDb();
} catch {}

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    const rawToken = String(token || "");
    const nextPassword = String(password || "");

    if (!rawToken || !strongPassword.test(nextPassword)) {
      return apiError("Parol talablarga mos emas", 400, "VALIDATION_ERROR");
    }

    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const row = await userStore.findPasswordResetByTokenHash(tokenHash);

    if (!row || row.used === 1 || new Date(row.expires_at).getTime() < Date.now()) {
      return apiError("Havola eskirgan yoki noto'g'ri", 400, "INVALID_TOKEN");
    }

    const hashed = await bcrypt.hash(nextPassword, 10);
    await userStore.updateUserPassword(row.user_id, hashed);
    await userStore.markPasswordResetUsed(row.id);

    return apiSuccess({ message: "Parol muvaffaqiyatli yangilandi" });
  } catch {
    return apiError("Xatolik yuz berdi");
  }
}

