import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { apiError, apiSuccess } from "@/lib/apiResponse";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return apiError("Fayl topilmadi", 400, "VALIDATION_ERROR");

    const allowed: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "video/mp4": "mp4",
      "video/webm": "webm",
      "video/quicktime": "mov",
    };
    const ext = allowed[file.type];
    if (!ext) {
      return apiError("Faqat rasm (JPG/PNG/WEBP) yoki video (MP4/WEBM) qabul qilinadi", 415, "UNSUPPORTED_MEDIA_TYPE");
    }

    const isVideo = file.type.startsWith("video/");
    const maxBytes = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for video, 5MB for image

    if (file.size > maxBytes) {
      return apiError(`Fayl hajmi ${isVideo ? '50MB' : '5MB'} dan oshmasligi kerak`, 413, "FILE_TOO_LARGE");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${crypto.randomBytes(16).toString("hex")}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return apiSuccess({ url: `/uploads/${filename}` });
  } catch (e) {
    console.error(e);
    return apiError("Yuklash xatoligi");
  }
}
