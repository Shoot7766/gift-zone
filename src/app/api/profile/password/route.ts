import { NextRequest } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { apiError, apiSuccess } from "@/lib/apiResponse";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("Ruxsat yo'q", 401, "UNAUTHORIZED");

    const { oldPassword, newPassword } = await req.json();
    if (!oldPassword || !newPassword) return apiError("Parollar kerak", 400, "VALIDATION_ERROR");
    if (newPassword.length < 6) return apiError("Parol kamida 6 ta belgi", 400, "VALIDATION_ERROR");

    const user = db.$client.prepare("SELECT password FROM users WHERE id = ?").get(session.user.id) as { password: string } | undefined;
    if (!user) return apiError("Foydalanuvchi topilmadi", 404, "NOT_FOUND");

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) return apiError("Joriy parol noto'g'ri", 400, "VALIDATION_ERROR");

    const hashed = await bcrypt.hash(newPassword, 10);
    db.$client.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, session.user.id);

    return apiSuccess({});
  } catch (e) {
    return apiError("Xatolik");
  }
}
