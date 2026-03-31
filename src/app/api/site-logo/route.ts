import { readFile } from "node:fs/promises";
import path from "node:path";

const LOGO_PATH =
  "C:\\Users\\User\\.cursor\\projects\\c-Users-User-sovg-a-sovga-app\\assets\\c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_d0373be01a45d615fa47e5f617add427_images_ChatGPT_Image_31____._2026__.__12_13_22-add0aeea-b476-46c1-b7bd-4c0b18ab2757.png";

export async function GET() {
  try {
    let file: Uint8Array;
    try {
      const buffer = await readFile(path.join(process.cwd(), "public", "logo.png"));
      file = new Uint8Array(buffer);
    } catch {
      const buffer = await readFile(LOGO_PATH);
      file = new Uint8Array(buffer);
    }
    return new Response(file, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" fill="none"><rect width="256" height="256" rx="48" fill="#111827"/><circle cx="92" cy="100" r="38" fill="#DB6DFF"/><circle cx="154" cy="156" r="46" fill="#23BCFF"/><text x="34" y="228" fill="white" font-size="44" font-family="Arial, sans-serif" font-weight="700">GZ</text></svg>`;
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }
}
