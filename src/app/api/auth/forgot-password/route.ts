import { NextRequest } from "next/server";
import { randomUUID, createHash, randomBytes } from "node:crypto";
import { initDb } from "@/db";
import { apiSuccess } from "@/lib/apiResponse";
import { getSiteUrl } from "@/lib/site";
import { sendMail } from "@/lib/mailer";
import { userStore } from "@/lib/userStore";

try {
  initDb();
} catch {}

export async function POST(req: NextRequest) {
  try {
    const { email, locale } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const targetLocale = String(locale || "uz");

    // Always return success to avoid leaking account existence.
    if (!normalizedEmail) {
      return apiSuccess({
        message: "Agar email mavjud bo'lsa, tiklash havolasi yuboriladi.",
      });
    }

    const user = await userStore.findUserByEmail(normalizedEmail);

    if (!user) {
      return apiSuccess({
        message: "Agar email mavjud bo'lsa, tiklash havolasi yuboriladi.",
      });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await userStore.createPasswordReset({
      id: randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = new URL(
      `/${targetLocale}/parolni-tiklash/${rawToken}`,
      getSiteUrl()
    ).toString();

    const subject = "Gift Zone - Parolni tiklash";
    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.6">
        <h2>Parolni tiklash</h2>
        <p>Salom ${user.name || ""},</p>
        <p>Parolingizni tiklash uchun quyidagi tugmani bosing. Havola 30 daqiqa amal qiladi.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#0ea5a5;color:#fff;text-decoration:none;border-radius:8px;">
            Parolni tiklash
          </a>
        </p>
        <p>Agar siz so'rov yubormagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.</p>
      </div>
    `;
    const text = `Parolni tiklash havolasi (30 daqiqa): ${resetUrl}`;
    await sendMail({ to: user.email, subject, html, text });

    return apiSuccess({
      message: "Agar email mavjud bo'lsa, tiklash havolasi yuboriladi.",
    });
  } catch {
    return apiSuccess({
      message: "Agar email mavjud bo'lsa, tiklash havolasi yuboriladi.",
    });
  }
}

