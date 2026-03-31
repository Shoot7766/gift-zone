import { db, initDb } from "@/db";

type Params = {
  params: Promise<{ locale: string; id: string }>;
};

const locales = ["uz", "uz-cyrl", "ru", "en"] as const;

export default async function Head({ params }: Params) {
  const { locale, id } = await params;
  try {
    initDb();
  } catch {}

  const product = db.$client
    .prepare(
      `
      SELECT p.title, p.description, p.price, s.name as shop_name
      FROM products p
      LEFT JOIN shops s ON p.shop_id = s.id
      WHERE p.id = ? AND p.is_active = 1
      LIMIT 1
    `
    )
    .get(id) as
    | { title: string; description: string | null; price: number; shop_name: string | null }
    | undefined;

  const title = product
    ? `${product.title} | Gift Zone`
    : "Mahsulot | Gift Zone";
  const description = product
    ? `${product.title}${product.shop_name ? ` - ${product.shop_name}` : ""}. ${product.description || "Premium sovg'a mahsuloti."}`
    : "Sovg'a mahsuloti sahifasi.";
  const canonical = `https://sovga.uz/${locale}/mahsulot/${id}`;

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
          href={`https://sovga.uz/${loc}/mahsulot/${id}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`https://sovga.uz/uz/mahsulot/${id}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="product" />
      <meta property="og:url" content={canonical} />
    </>
  );
}
