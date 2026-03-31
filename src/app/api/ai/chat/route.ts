import { NextRequest } from "next/server";
import { db, initDb } from "@/db";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";

try { initDb(); } catch {}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return apiError("Ruxsat yo'q", 403, "FORBIDDEN");
    }

    const queries = db.$client.prepare(`
      SELECT query, created_at
      FROM ai_queries
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    return apiSuccess({ queries });
  } catch (e) {
    console.error(e);
    return apiError("Xatolik yuz berdi");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return apiError("Xabar bo'sh bo'lishi mumkin emas", 400);
    }

    // Log the query for admin analytics
    db.$client.prepare("INSERT INTO ai_queries (query) VALUES (?)").run(message);

    // Simple keyword extraction for search
    const words = message.toLowerCase().replace(/[^\w\s]/gi, '').split(' ').filter(w => w.length > 2);
    
    let products: any[] = [];
    if (words.length > 0) {
      // Build a simple LIKE query for the words
      const conditions = words.map(() => `title LIKE ? OR description LIKE ?`).join(" OR ");
      const params = words.flatMap(w => [`%${w}%`, `%${w}%`]);
      
      products = db.$client.prepare(`
        SELECT id, title, price, (SELECT url FROM product_images WHERE product_id = products.id LIMIT 1) as image_url
        FROM products
        WHERE is_active = 1 AND (${conditions})
        LIMIT 4
      `).all(...params);
    } else {
      // If no specific words, just return some popular/random products
      products = db.$client.prepare(`
        SELECT id, title, price, (SELECT url FROM product_images WHERE product_id = products.id LIMIT 1) as image_url
        FROM products
        WHERE is_active = 1
        ORDER BY RANDOM()
        LIMIT 4
      `).all();
    }

    let replyText = "";
    if (products.length > 0) {
      replyText = `Sizning so'rovingiz bo'yicha quyidagi ajoyib sovg'alarni topdim! Ularni ko'rib chiqing:`;
    } else {
      replyText = `Kechirasiz, aynan shunday sovg'a topa olmadim. Ammo katalogimizda boshqa ko'plab qiziqarli narsalar bor!`;
      // Fetch random as fallback
      products = db.$client.prepare(`
        SELECT id, title, price, (SELECT url FROM product_images WHERE product_id = products.id LIMIT 1) as image_url
        FROM products
        WHERE is_active = 1
        ORDER BY RANDOM()
        LIMIT 4
      `).all();
    }

    return apiSuccess({ reply: replyText, products });
  } catch (e) {
    console.error(e);
    return apiError("Xatolik yuz berdi");
  }
}
