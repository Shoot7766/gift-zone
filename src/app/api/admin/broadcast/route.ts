import { NextRequest } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { apiError, apiSuccess } from "@/lib/apiResponse";

try {
  initDb();
} catch {}

export async function GET() {
  try {
    const session = await auth();
    const role = session?.user?.role || "customer";
    let announcements: unknown[] = [];
    if (role === "admin") {
      announcements = db.$client
        .prepare("SELECT * FROM announcements ORDER BY created_at DESC LIMIT 100")
        .all();
    } else {
      announcements = db.$client
        .prepare(
          `SELECT *
           FROM announcements
           WHERE is_active = 1
             AND (target_role = 'all' OR target_role = ?)
           ORDER BY created_at DESC
           LIMIT 5`
        )
        .all(role);
    }
    return apiSuccess({ announcements });
  } catch {
    return apiSuccess({ announcements: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
    }
    const { title, message, targetRole } = await req.json();
    if (!title || !message) {
      return apiError("Sarlavha va matn kerak", 400, "VALIDATION_ERROR");
    }
    const target =
      targetRole === "customer" || targetRole === "provider" || targetRole === "all"
        ? targetRole
        : "all";
    db.$client
      .prepare(
        `INSERT INTO announcements (id, title, message, target_role, is_active)
         VALUES (?, ?, ?, ?, 1)`
      )
      .run(generateId(), String(title).trim(), String(message).trim(), target);
    return apiSuccess({});
  } catch {
    return apiError("Xatolik");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
    }
    const { id, isActive } = await req.json();
    if (!id) return apiError("ID kerak", 400, "VALIDATION_ERROR");
    db.$client
      .prepare("UPDATE announcements SET is_active = ? WHERE id = ?")
      .run(isActive ? 1 : 0, id);
    return apiSuccess({});
  } catch {
    return apiError("Xatolik");
  }
}

