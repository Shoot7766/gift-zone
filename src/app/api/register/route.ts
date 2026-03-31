import { NextRequest } from "next/server";
import { db, initDb } from "@/db";
import bcrypt from "bcryptjs";
import { generateId } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { apiError, apiSuccess } from "@/lib/apiResponse";

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

    if (!name || !email || !password) {
      return apiError("Barcha maydonlar to'ldirilishi shart", 400, "VALIDATION_ERROR");
    }

    const existing = db.$client
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);

    if (existing) {
      return apiError("Bu email allaqachon ro'yxatdan o'tgan", 400, "EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = generateId();

    db.$client
      .prepare("INSERT INTO users (id, name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, name, email, hashedPassword, phone || null, role === "provider" ? "provider" : "customer");

    return apiSuccess({ message: "Ro'yxatdan o'tish muvaffaqiyatli!" });
  } catch (e) {
    console.error(e);
    return apiError("Xatolik yuz berdi");
  }
}
