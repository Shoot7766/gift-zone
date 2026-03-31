"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface Category { id: number; name: string; icon: string; slug: string; }

const CATEGORY_IMAGES: Record<string, string> = {
  "trending-gifts": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=160&h=160&fit=crop",
  "flowers": "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=160&h=160&fit=crop",
  "gift-boxes": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=160&h=160&fit=crop",
  "sweets-chocolate-gifts": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=160&h=160&fit=crop",
  "cakes": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=160&h=160&fit=crop",
  "toys": "https://images.unsplash.com/photo-1563901935883-cb7f5d0c2a4b?w=160&h=160&fit=crop",
  "romantic-gifts": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=160&h=160&fit=crop",
  "premium-gifts": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=160&h=160&fit=crop",
};

const FALLBACK: Category[] = [
  { id: 1, name: "Trend sovg'alar", icon: "🔥", slug: "trending-gifts" },
  { id: 2, name: "Gullar", icon: "🌸", slug: "flowers" },
  { id: 3, name: "Sovg'a qutilari", icon: "🎁", slug: "gift-boxes" },
  { id: 4, name: "Shirinlik va shokolad", icon: "🍫", slug: "sweets-chocolate-gifts" },
  { id: 5, name: "Tortlar", icon: "🎂", slug: "cakes" },
  { id: 6, name: "O'yinchoqlar", icon: "🧸", slug: "toys" },
  { id: 7, name: "Romantik sovg'alar", icon: "💘", slug: "romantic-gifts" },
  { id: 8, name: "Premium sovg'alar", icon: "💎", slug: "premium-gifts" },
];

const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as any, stiffness: 100, damping: 15 }
  }
};

export default function CategoriesSection() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const [categories, setCategories] = useState<Category[]>(FALLBACK);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { if (d.categories?.length) setCategories(d.categories); })
      .catch(() => {});
  }, []);

  return (
    <section className="section" style={{ background: "linear-gradient(180deg, var(--cream) 0%, var(--warm-white) 100%)" }}>
      <div className="container">
        <div className="section-header">
          <div>
            <div className="section-eyebrow">{t("categoriesTitle")}</div>
            <h2 className="section-title">Nimani <span className="highlight">qidiryapsiz?</span></h2>
          </div>
          <Link href="/katalog" className="btn btn-ghost btn-sm" style={{ color: "var(--gold-dark)" }}>
            {tCommon("seeAll")} <ArrowRight size={14} />
          </Link>
        </div>

        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariant}
          style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "1rem", marginTop: "2rem" }}
        >
          {categories.map((cat) => (
            <motion.div key={cat.id} variants={itemVariant}>
              <Link href={`/katalog?category=${cat.slug}`} style={{ textDecoration: "none" }}>
                <motion.div 
                  whileHover={{ y: -10, scale: 1.05, boxShadow: "0 20px 40px rgba(201,149,42,0.25)" }}
                  transition={{ type: "spring" as any, stiffness: 300, damping: 20 }}
                  style={{ 
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
                    cursor: "pointer", padding: "1rem", borderRadius: "1rem"
                  }}
                >
                  <div style={{ 
                    width: "80px", height: "80px", borderRadius: "50%", padding: "4px",
                    background: "linear-gradient(135deg, var(--gold), var(--teal))",
                    boxShadow: "0 10px 25px rgba(201,149,42,0.2)"
                  }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "var(--card-bg)" }}>
                       <img 
                         src={CATEGORY_IMAGES[cat.slug] || `https://picsum.photos/seed/${cat.slug}/160/160`} 
                         alt={cat.name}
                         style={{ width: "100%", height: "100%", objectFit: "cover" }}
                         loading="lazy"
                       />
                    </div>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--dark)", textAlign: "center", lineHeight: "1.2" }}>
                    {cat.name}
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 1024px) { div[style*="repeat(8, 1fr)"] { grid-template-columns: repeat(4, 1fr) !important; gap: 2rem 1rem !important; } }
        @media (max-width: 540px)  { div[style*="repeat(8, 1fr)"] { grid-template-columns: repeat(3, 1fr) !important; gap: 1.5rem 0.5rem !important; } }
      `}</style>
    </section>
  );
}
