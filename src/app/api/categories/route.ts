import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { CATEGORY_CATALOG } from "@/lib/categoryCatalog";

try { initDb(); } catch {}

export async function GET() {
  try {
    const allowedSlugs = new Set(CATEGORY_CATALOG.map((c) => c.slug));
    const upsertCategory = db.$client.prepare(`
      INSERT INTO categories (name, icon, image, slug, sort_order)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        icon = excluded.icon,
        image = excluded.image,
        sort_order = excluded.sort_order
    `);
    const findCategory = db.$client.prepare("SELECT id FROM categories WHERE slug = ?");
    const upsertSubcategory = db.$client.prepare(`
      INSERT INTO subcategories (category_id, name, icon, slug, sort_order)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        category_id = excluded.category_id,
        name = excluded.name,
        icon = excluded.icon,
        sort_order = excluded.sort_order
    `);
    const syncTx = db.$client.transaction(() => {
      for (const cat of CATEGORY_CATALOG) {
        upsertCategory.run(cat.name, cat.icon, cat.image || null, cat.slug, cat.sortOrder);
        const category = findCategory.get(cat.slug) as { id: number } | undefined;
        if (!category) continue;
        for (const sub of cat.subcategories) {
          upsertSubcategory.run(category.id, sub.name, sub.icon || null, sub.slug, sub.sortOrder);
        }
      }
    });
    syncTx();

    const categoriesAll = db.$client.prepare("SELECT * FROM categories ORDER BY sort_order ASC, id ASC").all() as Array<Record<string, any>>;
    const categories = categoriesAll.filter((c) => allowedSlugs.has(String(c.slug)));
    const allowedCategoryIds = new Set(categories.map((c) => Number(c.id)));
    const subcategoriesAll = db.$client.prepare("SELECT * FROM subcategories ORDER BY sort_order ASC, id ASC").all() as Array<Record<string, any>>;
    const subcategories = subcategoriesAll.filter((s) => allowedCategoryIds.has(Number(s.category_id)));
    const subMap = new Map<number, Array<Record<string, any>>>();
    for (const sub of subcategories) {
      const key = Number(sub.category_id);
      const list = subMap.get(key) || [];
      list.push(sub);
      subMap.set(key, list);
    }
    const categoriesTree = categories.map((cat) => ({
      ...cat,
      subcategories: subMap.get(Number(cat.id)) || [],
    }));
    const cities = db.$client.prepare("SELECT * FROM cities ORDER BY id").all();
    return NextResponse.json(
      { categories: categoriesTree, flatCategories: categories, subcategories, cities },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e) {
    console.error("CATEGORIES API ERROR:", e);
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}
