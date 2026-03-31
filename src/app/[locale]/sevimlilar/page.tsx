"use client";
import { useEffect, useState } from "react";
import { useWishlistStore } from "@/stores/wishlistStore";
import { ProductCard, ProductType } from "@/components/home/FeaturedProducts";
import { Heart, SearchX } from "lucide-react";
import { GlobalLoader } from "@/components/Loader";
import { motion } from "framer-motion";

export default function WishlistPage() {
  const { items: wishlistIds } = useWishlistStore();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlistIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/products?ids=${wishlistIds.join(",")}&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          // To maintain the user's addition order if desired, but we'll just show what returned
          setProducts(data.products);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wishlistIds]);

  return (
    <main className="container" style={{ padding: "4rem 1.5rem", minHeight: "80vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <Heart size={28} color="var(--red)" fill="var(--red-pale)" />
        <h1 style={{ margin: 0, fontWeight: "900", letterSpacing: "-0.02em" }}>Sevimlilar</h1>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
          <GlobalLoader />
        </div>
      ) : products.length > 0 ? (
        <motion.div 
          className="grid-4 stagger"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </motion.div>
      ) : (
        <div style={{ textAlign: "center", padding: "6rem 0", background: "white", borderRadius: "24px", boxShadow: "var(--shadow-sm)" }}>
           <SearchX size={64} color="var(--gray-300)" style={{ margin: "0 auto 1.5rem auto" }} />
           <h3 style={{ marginBottom: "1rem", color: "var(--dark)" }}>Hech narsa saqlanmagan</h3>
           <p style={{ color: "var(--gray-500)", marginBottom: "2rem", maxWidth: "400px", margin: "0 auto 2rem auto" }}>
              Sizga yoqqan mahsulotlardagi yurakcha belgisini bosing va ular shu yerda yig'iladi.
           </p>
           <a href="/katalog" className="btn btn-primary btn-lg">Katalogga o'tish</a>
        </div>
      )}
    </main>
  );
}
