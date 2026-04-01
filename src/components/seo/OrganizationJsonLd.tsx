import { getSiteUrl } from "@/lib/site";

export default function OrganizationJsonLd() {
  const origin = getSiteUrl().origin;
  const payload = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Gift Zone",
    url: origin,
    description: "O'zbekistonda sovg'a buyurtma qilish platformasi",
    sameAs: [] as string[],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
