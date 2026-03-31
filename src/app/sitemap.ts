import type { MetadataRoute } from "next";
import { db, initDb } from "@/db";

const locales = ["uz", "uz-cyrl", "ru", "en"] as const;
const staticPaths = [
  "",
  "/katalog",
  "/dokonlar",
  "/savat",
  "/yordam",
  "/kirish",
  "/royxat",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  try {
    initDb();
  } catch {}

  const products = db.$client
    .prepare("SELECT id, created_at FROM products WHERE is_active = 1")
    .all() as Array<{ id: string; created_at: string | null }>;

  const shops = db.$client
    .prepare("SELECT id, created_at FROM shops WHERE is_active = 1")
    .all() as Array<{ id: string; created_at: string | null }>;

  const resolveChangeFrequency = (
    path: string
  ): MetadataRoute.Sitemap[number]["changeFrequency"] =>
    path === "" ? "daily" : "weekly";

  const staticUrls = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `https://sovga.uz/${locale}${path}`,
      lastModified: now,
      changeFrequency: resolveChangeFrequency(path),
      priority: path === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map((loc) => [loc, `https://sovga.uz/${loc}${path}`])
        ),
      },
    }))
  );

  const productUrls = locales.flatMap((locale) =>
    products.map((product) => ({
      url: `https://sovga.uz/${locale}/mahsulot/${product.id}`,
      lastModified: product.created_at ? new Date(product.created_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((loc) => [
            loc,
            `https://sovga.uz/${loc}/mahsulot/${product.id}`,
          ])
        ),
      },
    }))
  );

  const shopUrls = locales.flatMap((locale) =>
    shops.map((shop) => ({
      url: `https://sovga.uz/${locale}/dokon/${shop.id}`,
      lastModified: shop.created_at ? new Date(shop.created_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
      alternates: {
        languages: Object.fromEntries(
          locales.map((loc) => [loc, `https://sovga.uz/${loc}/dokon/${shop.id}`])
        ),
      },
    }))
  );

  return [...staticUrls, ...productUrls, ...shopUrls];
}
