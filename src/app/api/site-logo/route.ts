import { readFile } from "node:fs/promises";

const LOGO_PATH =
  "C:\\Users\\User\\.cursor\\projects\\c-Users-User-sovg-a-sovga-app\\assets\\c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_d0373be01a45d615fa47e5f617add427_images_ChatGPT_Image_31____._2026__.__12_13_22-add0aeea-b476-46c1-b7bd-4c0b18ab2757.png";

export async function GET() {
  try {
    const file = await readFile(LOGO_PATH);
    return new Response(file, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Logo not found", { status: 404 });
  }
}
