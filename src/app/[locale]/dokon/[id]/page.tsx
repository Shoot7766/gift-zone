"use client";
import { useEffect, useState, use } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/navigation";
import { ProductCard } from "@/components/home/FeaturedProducts";
import { Star, MapPin, Phone, Send, Clock, Store, CheckCircle, ArrowLeft } from "lucide-react";
import { GlobalLoader } from "@/components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function ShopProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("home");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tProduct = useTranslations("product");
  
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shops/${id}`).then(r => r.json()).then(d => {
      setShop(d.shop);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <GlobalLoader />
    </div>
  );

  if (!shop) return (
    <div style={{ textAlign: "center", padding: "6rem", minHeight: "60vh" }}>
      <h2>{tProduct("shopNotFound")}</h2>
      <Link href="/dokonlar" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>
         {tNav("shops")}
      </Link>
    </div>
  );

  const shopJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: shop.name,
    description: shop.description || "",
    telephone: shop.phone || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: shop.city_name || "Toshkent",
      addressCountry: "UZ",
    },
    aggregateRating:
      Number(shop.reviews_count || 0) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(shop.rating || 0).toFixed(1),
            reviewCount: Number(shop.reviews_count || 0),
          }
        : undefined,
  };

  return (
    <div style={{ background: "var(--gray-50)", minHeight: "100vh" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shopJsonLd) }}
      />
      {/* Cover */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-light))", height: "280px", position: "relative" }}
      >
        {shop.cover_image && (
          <Image
            src={shop.cover_image}
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: "cover", position: "absolute", inset: 0, opacity: 0.6 }}
            priority
          />
        )}
        <div className="container" style={{ position: "relative", height: "100%", padding: "1.5rem" }}>
           <Link href="/dokonlar" style={{ color: "white", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>
              <ArrowLeft size={18} /> {tNav("shops")}
           </Link>
        </div>
      </motion.div>

      <main style={{ padding: "0 1.5rem 4rem" }}>
        <div className="container">
          {/* Shop header */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ display: "flex", gap: "2rem", alignItems: "flex-end", marginBottom: "3rem", marginTop: "-60px", flexWrap: "wrap", background: "white", padding: "2rem", borderRadius: "24px", boxShadow: "var(--shadow)" }}
          >
            <div style={{
              width: "120px", height: "120px", borderRadius: "24px",
              background: "white", border: "4px solid white",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--shadow-sm)", overflow: "hidden", flexShrink: 0
            }}>
              {shop.logo ? (
                <Image
                  src={shop.logo}
                  alt={shop.name}
                  width={120}
                  height={120}
                  sizes="120px"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Store size={48} color="var(--teal)" />
              )}
            </div>

            <div style={{ flex: 1, minWidth: "280px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <h1 style={{ color: "var(--dark)", fontSize: "2.25rem", margin: 0 }}>{shop.name}</h1>
                {shop.is_verified && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "var(--teal-pale)", color: "var(--teal)", padding: "0.25rem 0.875rem", borderRadius: "999px", fontSize: "0.85rem", fontWeight: "700" }}>
                    <CheckCircle size={14} /> Official
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", color: "var(--gray-500)", fontSize: "0.95rem" }}>
                {shop.city_name && <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><MapPin size={16} /> {shop.city_name}</span>}
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Star size={16} fill="#FCD34D" color="#FCD34D" /> 
                  <strong style={{ color: "var(--dark)" }}>{Number(shop.rating).toFixed(1)}</strong>
                  <span>({tProduct("reviewsCount", { count: shop.reviews_count })})</span>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
               {shop.phone && <a href={`tel:${shop.phone}`} className="btn btn-primary" style={{ borderRadius: "12px", padding: "0.75rem 1.5rem" }}><Phone size={18} style={{ marginRight: "0.35rem" }} /> Qo&apos;ng&apos;iroq</a>}
            </div>
          </motion.div>

          {/* Products Grid */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontWeight: "900", marginBottom: "1.5rem", fontSize: "1.5rem" }}>{tNav("catalog")} ({shop.products?.length || 0})</h2>
            <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {shop.products?.map((p: any) => (
                <ProductCard key={p.id} product={{ ...p, shop_name: shop.name, shop_id: shop.id }} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
