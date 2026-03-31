"use client";
import { Link } from "@/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Star, ShoppingCart, Heart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useToast } from "@/components/Toast";
import { formatPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

export interface ProductType {
  id: string; title: string; price: number; rating: number;
  primary_image: string; shop_name: string; shop_id: string;
  preparation_time: string; city_name: string; reviews_count: number;
  category_name: string;
  stock_qty?: number;
}

export function ProductCard({ product }: { product: ProductType }) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, hasItem } = useWishlistStore();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const saved = hasItem(product.id);
  const t = useTranslations("product");

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      productId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.primary_image,
      shopId: product.shop_id,
      shopName: product.shop_name,
      quantity: 1,
      preparationTime: product.preparation_time,
      stockQty: Number(product.stock_qty ?? 0),
    });
    setAdded(true);
    toast(t("addedToCart") || "Savatga qo'shildi", "success");
    setTimeout(() => setAdded(false), 2500);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product.id);
    
    // Attempt DB sync if logged in (optimistic update via zustand already happens)
    fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id })
    }).catch(console.error);

    toast(saved ? "Yoqtirganlardan olib tashlandi" : "Yoqtirganlarga qo'shildi", "info");
  };

  const productFallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#F3F4F6' offset='0'/><stop stop-color='#E5E7EB' offset='1'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='50%' y='52%' text-anchor='middle' fill='#6B7280' font-size='28'>Sovg'a rasmi</text></svg>`
    );
  const imgSrc = product.primary_image || productFallback;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
      }}
    >
      <Link href={`/mahsulot/${product.id}`} style={{ textDecoration: "none", display: "block" }}>
        <motion.div 
          className="product-card"
          whileHover={{ y: -10, scale: 1.02, boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Image */}
          <div className="product-card-img-wrap">
            <motion.img
              src={imgSrc}
              alt={product.title}
              loading="lazy"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.6 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = productFallback; }}
            />
            <div className="product-card-overlay" />

            {/* Badges */}
            <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {product.rating >= 4.7 && (
                <span className="badge badge-gold" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>🔥 {t("popular") || "Mashhur"}</span>
              )}
              {product.city_name && (
                <span className="badge badge-blue" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>📍 {product.city_name}</span>
              )}
            </div>

            {/* Action buttons on hover */}
            <div className="product-card-actions">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                style={{
                  width: "38px", height: "38px", borderRadius: "10px",
                  background: saved ? "#FEE2E2" : "rgba(255,255,255,0.95)",
                  border: "none", cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <Heart size={16} fill={saved ? "#EF4444" : "none"} color={saved ? "#EF4444" : "#374151"} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAdd}
                style={{
                  width: "38px", height: "38px", borderRadius: "10px",
                  background: added ? "var(--green)" : "rgba(255,255,255,0.95)",
                  border: "none", cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <AnimatePresence mode="wait">
                  {added ? (
                    <motion.span 
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      style={{ fontSize: "0.85rem", color: "white", fontWeight: "800" }}
                    >
                      ✓
                    </motion.span>
                  ) : (
                    <motion.div key="cart" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <ShoppingCart size={16} color="#374151" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Body */}
          <div className="product-card-body">
            <div className="product-card-shop">{product.shop_name}</div>
            <div className="product-card-title">{product.title}</div>
            {Number(product.stock_qty ?? 1) <= 0 && (
              <div style={{ marginBottom: "0.6rem" }}>
                <span className="badge badge-red">Omborda yo'q</span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                <Star size={13} fill="#FCD34D" color="#FCD34D" />
                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#0D1B2A" }}>{Number(product.rating).toFixed(1)}</span>
              </div>
              <span style={{ color: "var(--gray-300)", fontSize: "0.75rem" }}>·</span>
              <span style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>{product.reviews_count} ta sharh</span>
            </div>

            <div className="product-card-footer" style={{ marginTop: "auto" }}>
              <div className="product-card-price">{formatPrice(product.price)}</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: added ? "var(--green)" : "var(--teal)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", color: "white",
                  boxShadow: added ? "0 4px 16px rgba(16,185,129,0.35)" : "0 4px 12px rgba(27,67,50,0.15)",
                }}
              >
                {added ? <span style={{ fontSize: "1rem" }}>✓</span> : <ShoppingCart size={18} />}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function ProductSkeleton() {
  return (
    <div className="product-card skeleton-card">
      <div className="skeleton" style={{ height: "210px" }} />
      <div style={{ padding: "1.25rem" }}>
        <div className="skeleton" style={{ height: "12px", width: "40%", marginBottom: "0.75rem" }} />
        <div className="skeleton" style={{ height: "16px", marginBottom: "0.4rem" }} />
        <div className="skeleton" style={{ height: "16px", width: "70%", marginBottom: "1rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="skeleton" style={{ height: "20px", width: "45%" }} />
          <div className="skeleton" style={{ height: "40px", width: "40px", borderRadius: "var(--r)" }} />
        </div>
      </div>
    </div>
  );
}

export default function FeaturedProducts({ limit = 8 }: { limit?: number }) {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
      setLoading(false);
    }, 10000);

    fetch(`/api/products?limit=${limit}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => { setProducts(d.products || []); setLoading(false); })
      .catch(() => setLoading(false))
      .finally(() => window.clearTimeout(timeout));

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [limit]);

  return (
    <section className="section" style={{ background: "var(--card-bg)" }}>
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          <div>
            <div className="section-eyebrow">{tHome("featuredEyebrow") || "Tanlangan mahsulotlar"}</div>
            <h2 className="section-title">
              {tHome.rich("featuredTitleRich", {
                highlight: (chunks) => <span className="highlight">{chunks}</span>,
                fallback: "Ommabop Sovg'alar"
              })}
            </h2>
          </div>
          <Link href="/katalog" className="btn btn-outline btn-sm">
            {tCommon("seeAll")} <ArrowRight size={15} />
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
          {loading
            ? [...Array(limit)].map((_, i) => <ProductSkeleton key={i} />)
            : products.length > 0
            ? products.map((p) => <ProductCard key={p.id} product={p} />)
            : (
              <div style={{ gridColumn: "1/-1", padding: "2.5rem 0", textAlign: "center", color: "var(--gray-500)" }}>
                Hozircha mahsulot topilmadi
              </div>
            )}
        </motion.div>
      </div>
    </section>
  );
}
