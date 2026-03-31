"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Star, MapPin, Store, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Shop {
  id: string; name: string; description: string;
  rating: number; reviews_count: number; city_name: string;
  logo: string; cover_image?: string; products_count: number; is_verified: boolean;
}

export default function FeaturedShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shops?limit=4")
      .then((r) => r.json())
      .then((d) => {
        const sorted = (d.shops || []).sort((a: Shop, b: Shop) => b.rating - a.rating).slice(0, 4);
        setShops(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const shopCoverFallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#1B4332' offset='0'/><stop stop-color='#40916C' offset='1'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`
    );
  const logoFallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><rect width='100%' height='100%' rx='24' fill='#F3F4F6'/><text x='50%' y='54%' text-anchor='middle' font-size='56'>🏪</text></svg>`
    );

  return (
    <section className="section" style={{ background: "var(--gray-50)" }}>
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          <div>
            <div className="section-eyebrow">Do'konlar</div>
            <h2 className="section-title">Eng Yaxshi <span className="highlight">Do&apos;konlar</span></h2>
          </div>
          <Link href="/dokonlar" className="btn btn-outline btn-sm">
            Hammasini ko&apos;rish <ArrowRight size={15} />
          </Link>
        </motion.div>

        <motion.div 
          className="grid-4 stagger"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="shop-card skeleton-card">
                <div className="skeleton" style={{ height: "150px" }} />
                <div style={{ padding: "3rem 1.5rem 1.5rem" }}>
                  <div className="skeleton" style={{ height: "20px", width: "60%", marginBottom: "0.75rem" }} />
                  <div className="skeleton" style={{ height: "14px", width: "40%", marginBottom: "0.5rem" }} />
                  <div className="skeleton" style={{ height: "14px", marginBottom: "0.5rem" }} />
                  <div className="skeleton" style={{ height: "14px", width: "80%" }} />
                </div>
              </div>
            ))
          ) : shops.length > 0 ? shops.map((shop, index) => (
            <motion.div 
              key={shop.id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
              }}
            >
              <Link href={`/dokon/${shop.id}`} style={{ textDecoration: "none" }}>
                <motion.div 
                  className="shop-card"
                  whileHover={{ y: -10, scale: 1.02, boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="shop-card-cover">
                    {/* Rank Badge */}
                    <div style={{
                      position: "absolute",
                      top: "1rem",
                      left: "1rem",
                      background: index === 0 ? "linear-gradient(135deg, #FFD700, #FDB931)" : 
                                  index === 1 ? "linear-gradient(135deg, #E0E0E0, #BDBDBD)" :
                                  index === 2 ? "linear-gradient(135deg, #CD7F32, #A0522D)" :
                                  "rgba(0,0,0,0.5)",
                      color: index < 3 ? "var(--dark)" : "white",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "900",
                      fontSize: "1.1rem",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      zIndex: 5,
                      border: "2px solid var(--card-bg)"
                    }}>
                      #{index + 1}
                    </div>
                    <img
                      src={shop.cover_image || shopCoverFallback}
                      alt={shop.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = shopCoverFallback;
                      }}
                    />
                  </div>
                  <div className="shop-card-logo">
                    {shop.logo
                      ? <img src={shop.logo} alt={shop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = logoFallback; }} />
                      : <Store size={28} color="var(--teal)" />}
                  </div>
                  <div className="shop-card-body">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "800" }}>{shop.name}</h3>
                      {shop.is_verified && (
                        <CheckCircle size={16} color="var(--green)" />
                      )}
                    </div>

                    {shop.city_name && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "var(--gray-400)", marginBottom: "0.875rem" }}>
                        <MapPin size={13} /> {shop.city_name}
                      </div>
                    )}

                    <p style={{ fontSize: "0.875rem", color: "var(--gray-500)", marginBottom: "1.25rem",
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineClamp: 2 }}>
                      {shop.description || "Premium sovg'a do'koni"}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Star size={14} fill="#FCD34D" color="#FCD34D" />
                        <span style={{ fontWeight: "800", fontSize: "0.9rem" }}>{Number(shop.rating).toFixed(1)}</span>
                        <span style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>({shop.reviews_count})</span>
                      </div>
                      <span style={{
                        fontSize: "0.8rem", color: "var(--teal)", fontWeight: "700",
                        background: "var(--teal-pale)", padding: "0.25rem 0.625rem", borderRadius: "var(--r-full)"
                      }}>
                        {shop.products_count || 0} mahsulot
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          )) : null}
        </motion.div>
      </div>
    </section>
  );
}
