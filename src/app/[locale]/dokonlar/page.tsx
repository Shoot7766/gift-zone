"use client";
import { useEffect, useState } from "react";
import { useRouter, Link } from "@/navigation";
import { Store, Star, MapPin, ChevronRight, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

export default function ShopsPage() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/shops").then(r => r.json()).then(d => { setShops(d.shops || []); setLoading(false); });
  }, []);

  const filteredShops = shops.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ background: "var(--gray-50)", minHeight: "100vh", padding: "4rem 1.5rem" }}>
      <main className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem", flexWrap: "wrap", gap: "2rem" }}>
          <div>
            <div className="section-eyebrow">{t("shopsTitle") || "Brandlar"}</div>
            <h1 className="section-title" style={{ marginBottom: 0 }}>{t("shopsTitle")}</h1>
          </div>
          <div style={{ position: "relative", width: "100%", maxWidth: "360px" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder={tCommon("search") || "Do'kon qidiring..."} 
              style={{ paddingLeft: "3rem" }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid-3">
               {[...Array(6)].map((_, i) => (
                 <div key={i} style={{ background: "white", borderRadius: "20px", height: "300px", animation: "pulse 1.5s infinite" }} />
               ))}
             </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid-3">
              {filteredShops.map((shop, i) => (
                <Link key={shop.id} href={`/dokon/${shop.id}`} style={{ textDecoration: "none" }}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="shop-card-large"
                    style={{ background: "white", borderRadius: "24px", padding: "1.5rem", boxShadow: "var(--shadow-xs)", border: "1px solid var(--gray-50)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
                       <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--teal-pale)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {shop.logo ? <img src={shop.logo} alt={shop.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "16px" }} /> : <Store size={28} color="var(--teal)" />}
                       </div>
                       <div>
                         <h3 style={{ fontWeight: "800", fontSize: "1.25rem", color: "var(--dark)", marginBottom: "0.25rem" }}>{shop.name}</h3>
                         <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--gray-500)" }}>
                          <Star size={14} fill="#FCD34D" color="#FCD34D" /> {shop.rating || "5.0"} • {tCommon("found", { count: shop._count?.products || 0 })}
                         </div>
                       </div>
                    </div>
                    {shop.description && <p style={{ fontSize: "0.95rem", color: "var(--gray-600)", lineHeight: "1.6", marginBottom: "1.5rem" }}>{shop.description}</p>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid var(--gray-50)" }}>
                       <span style={{ fontSize: "0.875rem", color: "var(--gray-400)", display: "flex", alignItems: "center", gap: "0.25rem" }}><MapPin size={14} /> Uzbekistan</span>
                       <span className="btn btn-ghost btn-sm" style={{ color: "var(--teal)", fontWeight: "700" }}>{tNav("login")} <ChevronRight size={16} /></span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <style>{`
        .shop-card-large { transition: all 0.3s ease; }
        .shop-card-large:hover { transform: translateY(-8px); boxShadow: var(--shadow-lg); border-color: var(--teal-pale); }
      `}</style>
    </div>
  );
}
