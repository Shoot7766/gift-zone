import { NextRequest } from "next/server";
import { initDb } from "@/db";
import bcrypt from "bcryptjs";
import { generateId } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { userStore } from "@/lib/userStore";

try { initDb(); } catch {}

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(
      `register:${getClientIp(req)}`,
      8,
      15 * 60 * 1000
    );
    if (!rate.ok) {
      return apiError(
        "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.",
        429,
        "RATE_LIMIT"
      );
    }

    const { name, email, password, phone, role } = await req.json();
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
    const passwordValue = typeof password === "string" ? password : "";
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!normalizedName || !normalizedEmail || !passwordValue) {
      return apiError("Barcha maydonlar to'ldirilishi shart", 400, "VALIDATION_ERROR");
    }
    if (normalizedName.split(/\s+/).length < 2) {
      return apiError("Ism va familyani alohida kiriting", 400, "VALIDATION_ERROR");
    }
    if (!/^\+998\d{9}$/.test(normalizedPhone)) {
      return apiError("Telefon +998 bilan va 9 ta raqam formatida bo'lishi shart", 400, "VALIDATION_ERROR");
    }
    if (!strongPassword.test(passwordValue)) {
      return apiError("Parol kuchli bo'lishi shart (8+, katta/kichik harf, raqam, maxsus belgi)", 400, "VALIDATION_ERROR");
    }

    const existing = await userStore.findUserByEmail(normalizedEmail);

    if (existing) {
      return apiError("Bu email allaqachon ro'yxatdan o'tgan", 400, "EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(passwordValue, 10);
    const id = generateId();

    await userStore.createUser({
      id,
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone || null,
      role: role === "provider" ? "provider" : "customer",
    });

    return apiSuccess({ message: "Ro'yxatdan o'tish muvaffaqiyatli!" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Xatolik yuz berdi";
    if (
      message.includes("UNIQUE constraint failed: users.email") ||
      message.includes("UNIQUE constraint failed") ||
      message.toLowerCase().includes("unique")
    ) {
      return apiError("Bu email allaqachon ro'yxatdan o'tgan", 400, "EMAIL_EXISTS");
    }
    console.error("Register error:", e);
    return apiError(message, 500, "REGISTER_ERROR");
  }
}
