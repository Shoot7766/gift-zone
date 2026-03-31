"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { ProductCard } from "@/components/home/FeaturedProducts";
import { X, SearchX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EmojiEmpty } from "@/components/Loader";
import { useTranslations } from "next-intl";

interface Subcategory { id: number; name: string; icon?: string; slug: string; category_id: number; }
interface Category { id: number; name: string; icon: string; slug: string; subcategories?: Subcategory[]; }
function CatalogContent() {
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tCatalog = useTranslations("catalog");

  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    subcategory: searchParams.get("subcategory") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    rating: searchParams.get("rating") || "",
    sort: searchParams.get("sort") || "popularity",
  });
  const [searchKeyword, setSearchKeyword] = useState(filters.search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(p => ({ ...p, search: searchKeyword }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => {
      setCategories(d.categories || []);
    });
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.subcategory) params.set("subcategory", filters.subcategory);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.rating) params.set("rating", filters.rating);
    if (filters.sort) params.set("sort", filters.sort);
    params.set("limit", "24");

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  const resetFilters = () => {
    setFilters({ search: "", category: "", subcategory: "", minPrice: "", maxPrice: "", rating: "", sort: "popularity" });
    setSearchKeyword("");
  };

  const activeFiltersCount = [
    filters.search,
    filters.category,
    filters.subcategory,
    filters.minPrice,
    filters.maxPrice,
    filters.rating,
  ].filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-mid))", padding: "4rem 1.5rem" }}
      >
        <div className="container">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ color: "white", marginBottom: "1.5rem", fontWeight: "900", letterSpacing: "-0.02em" }}
          >
            {tNav("catalog")}
          </motion.h1>
        </div>
      </motion.div>

      <div className="container" style={{ padding: "2rem 1.5rem" }}>
        <div className="catalog-layout" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "2rem" }}>

          {/* Sidebar Filters */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="catalog-filters"
            style={{ background: "var(--card-bg)", borderRadius: "16px", padding: "1.5rem", boxShadow: "var(--shadow-xs)", height: "fit-content", position: "sticky", top: "88px", border: "1px solid var(--gray-100)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>{tCatalog("filters")}</h3>
              {activeFiltersCount > 0 && (
                <button onClick={resetFilters} className="btn btn-ghost btn-sm" style={{ color: "var(--red)", padding: "0.25rem 0.5rem" }}>
                  <X size={14} /> {tCatalog("clear")}
                </button>
              )}
            </div>

            <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", borderRadius: "12px", background: "var(--teal-pale)", color: "var(--teal-dark)", fontSize: "0.85rem", fontWeight: "700", lineHeight: 1.45 }}>
              {tCommon("found", { count: products.length })}
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">{tCatalog("category")}</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <button onClick={() => setFilters(p => ({ ...p, category: "", subcategory: "" }))}
                  style={{ textAlign: "left", padding: "0.5rem", borderRadius: "8px", border: "none", background: !filters.category ? "var(--teal-pale)" : "transparent", color: !filters.category ? "var(--teal)" : "var(--gray-600)", cursor: "pointer", fontWeight: !filters.category ? "600" : "400", fontFamily: "Outfit, sans-serif", fontSize: "0.9rem" }}>
                  {tCatalog("allCategories")}
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setFilters(p => ({ ...p, category: cat.slug, subcategory: "" }))}
                    style={{ textAlign: "left", padding: "0.5rem", borderRadius: "8px", border: "none", background: filters.category === cat.slug ? "var(--teal-pale)" : "transparent", color: filters.category === cat.slug ? "var(--teal)" : "var(--gray-600)", cursor: "pointer", fontWeight: filters.category === cat.slug ? "600" : "400", fontFamily: "Outfit, sans-serif", fontSize: "0.9rem", display: "flex", gap: "0.5rem" }}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {filters.category && (
              <>
                <div style={{ height: "1px", background: "var(--gray-100)", margin: "1rem 0" }} />
                <div className="form-group">
                  <label className="form-label">{tCatalog("subcategory")}</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: "200px", overflowY: "auto" }}>
                    <button
                      onClick={() => setFilters(p => ({ ...p, subcategory: "" }))}
                      style={{ textAlign: "left", padding: "0.45rem", borderRadius: "8px", border: "none", background: !filters.subcategory ? "var(--teal-pale)" : "transparent", color: !filters.subcategory ? "var(--teal)" : "var(--gray-600)", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                      {tCatalog("allSubcategories")}
                    </button>
                    {(categories.find((c) => c.slug === filters.category)?.subcategories || []).map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setFilters((p) => ({ ...p, subcategory: sub.slug }))}
                        style={{ textAlign: "left", padding: "0.45rem", borderRadius: "8px", border: "none", background: filters.subcategory === sub.slug ? "var(--teal-pale)" : "transparent", color: filters.subcategory === sub.slug ? "var(--teal)" : "var(--gray-600)", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        {sub.icon ? `${sub.icon} ` : ""}{sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={{ height: "1px", background: "var(--gray-100)", margin: "1rem 0" }} />

            {/* City (Hozircha olib tashlandi)
            <div className="form-group">
              <label className="form-label">Shahar</label>
              <select className="form-input" style={{ width: "100%", padding: "0.5rem" }}
                value={filters.city}
                onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}>
                <option value="">Barcha shaharlar</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ height: "1px", background: "var(--gray-100)", margin: "1rem 0" }} />
            */}

            {/* Price */}
            <div className="form-group">
              <label className="form-label">{tCatalog("priceRange")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input type="number" placeholder={tCatalog("from")} className="form-input"
                  value={filters.minPrice}
                  onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))}
                  style={{ fontSize: "0.875rem", width: "100%" }} />
                <input type="number" placeholder={tCatalog("to")} className="form-input"
                  value={filters.maxPrice}
                  onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
                  style={{ fontSize: "0.875rem", width: "100%" }} />
              </div>
            </div>

            <div style={{ height: "1px", background: "var(--gray-100)", margin: "1rem 0" }} />

            {/* Rating */}
            <div className="form-group">
              <label className="form-label">{tCatalog("rating")}</label>
              <select className="form-input" style={{ width: "100%", padding: "0.5rem" }}
                value={filters.rating}
                onChange={e => setFilters(p => ({ ...p, rating: e.target.value }))}>
                <option value="">{tCatalog("all")}</option>
                <option value="4">4+ ★</option>
                <option value="3">3+ ★</option>
              </select>
            </div>
          </motion.div>

          {/* Products Grid */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <p style={{ color: "var(--gray-400)", fontSize: "0.9rem", fontWeight: "600" }}>
                {loading ? tCommon("loading") : tCatalog("totalFound", { count: products.length })}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                 <span style={{ fontSize: "0.85rem", color: "var(--gray-500)", fontWeight: "700" }}>{tCatalog("sort")}:</span>
                 <select 
                    className="form-input" 
                    style={{ padding: "0.4rem 0.75rem", borderRadius: "10px", fontSize: "0.85rem", width: "auto", border: "1px solid var(--gray-200)" }}
                    value={filters.sort}
                    onChange={e => setFilters(p => ({ ...p, sort: e.target.value }))}
                 >
                    <option value="popularity">{tCatalog("sortPopularity")}</option>
                    <option value="price_asc">{tCatalog("sortPriceAsc")}</option>
                    <option value="price_desc">{tCatalog("sortPriceDesc")}</option>
                    <option value="rating_desc">{tCatalog("sortRatingDesc")}</option>
                 </select>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  className="catalog-products-grid"
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}
                >
                  {[...Array(8)].map((_, i) => (
                    <div key={i} style={{ background: "var(--gray-100)", borderRadius: "20px", height: "360px", animation: "pulse 1.5s infinite" }} />
                  ))}
                </motion.div>
              ) : products.length > 0 ? (
                <motion.div
                  className="catalog-products-grid"
                  key="products"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}
                >
                  {products.map((p: any) => (
                    <motion.div 
                      key={p.id}
                      variants={{
                        hidden: { opacity: 0, scale: 0.95, y: 10 },
                        visible: { opacity: 1, scale: 1, y: 0 }
                      }}
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <EmojiEmpty
                    icon={<SearchX size={40} />}
                    title={tCatalog("emptyTitle")}
                    desc={tCatalog("emptyDesc")}
                  />
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "1.25rem" }}>
                    <button type="button" className="btn btn-primary" onClick={resetFilters}>
                      {tCatalog("clear")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @media (max-width: 900px) {
          .catalog-layout {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .catalog-filters {
            position: static !important;
            top: auto !important;
          }
        }
        @media (max-width: 640px) {
          .catalog-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.9rem !important;
          }
          .catalog-layout {
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CatalogPage() {
  return <Suspense><CatalogContent /></Suspense>;
}
