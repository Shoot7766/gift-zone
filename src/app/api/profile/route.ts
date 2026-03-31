import { NextRequest } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/apiResponse";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("Ruxsat yo'q", 401, "UNAUTHORIZED");

    const { name, phone } = await req.json();
    if (!name) return apiError("Ism kerak", 400, "VALIDATION_ERROR");

    db.$client.prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?")
      .run(name, phone || null, session.user.id);

    return apiSuccess({});
  } catch (e) {
    return apiError("Xatolik");
  }
}
