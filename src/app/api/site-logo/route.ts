import { readFile } from "node:fs/promises";
import path from "node:path";

const LOGO_PATH =
  "C:\\Users\\User\\.cursor\\projects\\c-Users-User-sovg-a-sovga-app\\assets\\c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_d0373be01a45d615fa47e5f617add427_images_ChatGPT_Image_31____._2026__.__12_13_22-127f6373-964a-4d77-81d0-0728752e8cd8.png";

export async function GET() {
  try {
    let file: ArrayBuffer;
    try {
      const buffer = await readFile(path.join(process.cwd(), "public", "logo.png"));
      file = new ArrayBuffer(buffer.byteLength);
      new Uint8Array(file).set(buffer);
    } catch {
      const buffer = await readFile(LOGO_PATH);
      file = new ArrayBuffer(buffer.byteLength);
      new Uint8Array(file).set(buffer);
    }
    return new Response(new Blob([file], { type: "image/png" }), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" fill="none"><rect width="256" height="256" rx="48" fill="#111827"/><circle cx="92" cy="100" r="38" fill="#DB6DFF"/><circle cx="154" cy="156" r="46" fill="#23BCFF"/><text x="34" y="228" fill="white" font-size="44" font-family="Arial, sans-serif" font-weight="700">GZ</text></svg>`;
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
