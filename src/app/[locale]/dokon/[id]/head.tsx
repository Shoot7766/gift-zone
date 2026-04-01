import { db, initDb } from "@/db";
import { getSiteUrl } from "@/lib/site";

type Params = {
  params: Promise<{ locale: string; id: string }>;
};

const locales = ["uz", "uz-cyrl", "ru", "en"] as const;

export default async function Head({ params }: Params) {
  const { locale, id } = await params;
  const origin = getSiteUrl().origin;
  try {
    initDb();
  } catch {}

  const shop = db.$client
    .prepare(
      `
      SELECT s.name, s.description, c.name as city_name
      FROM shops s
      LEFT JOIN cities c ON s.city_id = c.id
      WHERE s.id = ? AND s.is_active = 1
      LIMIT 1
    `
    )
    .get(id) as
    | { name: string; description: string | null; city_name: string | null }
    | undefined;

  const title = shop ? `${shop.name} | Gift Zone` : "Do'kon | Gift Zone";
  const description = shop
    ? `${shop.name}${shop.city_name ? ` (${shop.city_name})` : ""}. ${shop.description || "Gift Zone do'kon sahifasi."}`
    : "Gift Zone do'kon sahifasi.";
  const canonical = `${origin}/${locale}/dokon/${id}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {locales.map((loc) => (
        <link
          key={loc}
          rel="alternate"
          hrefLang={loc}
          href={`${origin}/${loc}/dokon/${id}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${origin}/uz/dokon/${id}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
    </>
  );
}
