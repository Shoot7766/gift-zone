"use client";
import { useEffect, useState, use } from "react";
import { useRouter, Link } from "@/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { formatPrice } from "@/lib/utils";
import { Star, ShoppingCart, Clock, Store, Eye, ArrowRight, Heart, Share2, MessageSquare, MapPin, Calendar } from "lucide-react";
import { ProductCard, ProductType } from "@/components/home/FeaturedProducts";
import { GlobalLoader } from "@/components/Loader";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, hasItem } = useWishlistStore();
  const { toast } = useToast();
  
  const t = useTranslations("product");
  const tHome = useTranslations("home");
  const tNav = useTranslations("nav");
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Events state
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [showEventPicker, setShowEventPicker] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => { 
        setProduct(d.product);
        setRelatedProducts(d.product?.related || []);
        fetchReviews();
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/user-events").then(r => r.json()).then(d => setUserEvents(d.events || []));
    }
  }, [session]);

  const fetchReviews = () => {
    fetch(`/api/reviews?productId=${id}`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .catch(console.error);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (Number(product.stock_qty ?? 0) <= 0) {
      toast("Mahsulot omborda qolmagan", "error");
      return;
    }
    const images = product.images || [];
    addItem({
      id: product.id,
      productId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: images[0]?.url || `https://picsum.photos/seed/${product.id}/400/300`,
      shopId: product.shop_id,
      shopName: product.shop_name,
      quantity,
      preparationTime: product.preparation_time,
      stockQty: Number(product.stock_qty ?? 0),
    });
    setAdded(true);
    toast("Savatga qo'shildi", "success");
    setTimeout(() => setAdded(false), 3000);
  };

  const handleOrderNow = () => {
    handleAddToCart();
    router.push("/savat");
  };

  const handleSave = () => {
    if (!product) return;
    toggleItem(product.id);
    fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id })
    }).catch(console.error);
    toast(hasItem(product.id) ? "Yoqtirganlardan olib tashlandi" : "Yoqtirganlarga qo'shildi", "info");
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast("Sharh qoldirish uchun tizimga kiring", "error");
      router.push("/kirish");
      return;
    }
    setSubmittingReview(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, rating: reviewRating, comment: reviewText }),
    });
    
    setSubmittingReview(false);
    if (res.ok) {
      toast("Sharhingiz qo'shildi!", "success");
      setReviewText("");
      fetchReviews();
      setProduct((p: any) => ({
         ...p, 
         reviews_count: p.reviews_count + 1,
         rating: ((p.rating * p.reviews_count) + reviewRating) / (p.reviews_count + 1)
      }));
    } else {
      const err = await res.json();
      toast(err.error || "Xatolik yuz berdi", "error");
    }
  };

  const handleStartChat = async () => {
    if (!session?.user) {
      toast("Sotuvchi bilan bog'lanish uchun tizimga kiring", "error");
      router.push("/kirish");
      return;
    }
    if (!product) return;
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: product.shop_id }),
      });
      if (res.ok) {
        const { chat } = await res.json();
        const chatBase =
          session?.user?.role === "provider"
            ? "/provider/chat"
            : session?.user?.role === "admin"
            ? "/admin"
            : "/dashboard/chat";
        router.push(`${chatBase}?chatId=${chat.id}`);
      } else {
        toast("Suhbat boshlashda xatolik", "error");
      }
    } catch (e) {
      toast("Xatolik yuz berdi", "error");
    }
  };

  const handleLinkToEvent = async (eventId: string) => {
    if (!product) return;
    try {
      const res = await fetch("/api/user-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, existingEventId: eventId }),
      });
      if (res.ok) {
        toast("Sovg'a tadbirga biriktirildi", "success");
        setShowEventPicker(false);
      }
    } catch (e) {
      toast("Xatolik", "error");
    }
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <GlobalLoader />
    </div>
  );

  if (!product) return (
    <div style={{ textAlign: "center", padding: "6rem", minHeight: "60vh" }}>
      <h2>{t("productNotFound")}</h2>
      <Link href="/katalog" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>{tNav("catalog")}</Link>
    </div>
  );

  const images = product.images?.length > 0
    ? product.images.map((img: any) => img.url)
    : [`https://picsum.photos/seed/${product.id}/600/450`, `https://picsum.photos/seed/${product.id}a/600/450`];
    
  const saved = hasItem(product.id);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || "",
    brand: product.shop_name || "Gift Zone",
    offers: {
      "@type": "Offer",
      priceCurrency: "UZS",
      price: Number(product.price || 0),
      availability: "https://schema.org/InStock",
    },
    aggregateRating:
      product.reviews_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(product.rating || 0).toFixed(1),
            reviewCount: Number(product.reviews_count || 0),
          }
        : undefined,
  };

  return (
    <div style={{ background: "var(--gray-50)", minHeight: "100vh", padding: "2rem 1.5rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <main className="container" style={{ maxWidth: "1200px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "2rem", fontSize: "0.875rem", color: "var(--gray-400)" }}>
          <Link href="/" style={{ color: "var(--gray-400)", textDecoration: "none" }}>{tNav("home")}</Link>
          <span>›</span>
          <Link href="/katalog" style={{ color: "var(--gray-400)", textDecoration: "none" }}>{tNav("catalog")}</Link>
          <span>›</span>
          <span style={{ color: "var(--dark)", fontWeight: "600" }}>{product.title}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "3rem", alignItems: "start" }} className="product-layout-main">
          {/* Images Section */}
          <div className="product-images-sticky">
            <div style={{ borderRadius: "var(--r-xl)", overflow: "hidden", marginBottom: "1rem", aspectRatio: "4/3", background: "white", boxShadow: "var(--shadow-sm)", position: "relative" }}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  src={images[activeImage]}
                  alt={product.title}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }}
                />
              </AnimatePresence>
              
              <button 
                onClick={handleSave}
                style={{ position: "absolute", top: "1rem", right: "1rem", width: "44px", height: "44px", borderRadius: "50%", background: saved ? "#FEE2E2" : "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", transition: "all 0.2s" }}
              >
                <Heart size={20} fill={saved ? "#EF4444" : "none"} color={saved ? "#EF4444" : "#374151"} />
              </button>
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {images.map((img: string, k: number) => (
                  <button
                    key={k}
                    onClick={() => setActiveImage(k)}
                    style={{
                      width: "80px", height: "80px", borderRadius: "var(--r)", flexShrink: 0, padding: 0,
                      border: activeImage === k ? "2px solid var(--teal)" : "2px solid transparent",
                      overflow: "hidden", cursor: "pointer", transition: "all 0.2s",
                      opacity: activeImage === k ? 1 : 0.6
                    }}
                  >
                    <Image
                      src={img}
                      alt={`Thumb ${k}`}
                      width={80}
                      height={80}
                      sizes="80px"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div>
             <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <span className="badge badge-gold" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}>Premium</span>
                <span style={{ fontSize: "0.85rem", color: "var(--gray-500)", display: "flex", alignItems: "center", gap: "0.3rem" }}><Eye size={14}/> 120 so'nggi ko'rishlar</span>
             </div>
             
             <h1 style={{ fontSize: "2.2rem", fontWeight: "900", marginBottom: "1rem", lineHeight: "1.2", letterSpacing: "-0.03em" }}>
                {product.title}
             </h1>

             <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem", borderBottom: "1px solid var(--gray-200)", paddingBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "1.1rem", fontWeight: "800", color: "#F59E0B" }}>
                   <Star size={20} fill="#FCD34D" color="#FCD34D" /> {Number(product.rating || 0).toFixed(1)}
                </div>
                <div style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>{product.reviews_count} sharhlar</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--gray-400)", fontSize: "0.9rem" }}>
                   <Clock size={16} /> Tayyor bo'lish: {product.preparation_time || "1 kun"}
                </div>
             </div>

             <div style={{ fontSize: "3rem", fontWeight: "900", color: "var(--teal-dark)", marginBottom: "2rem", letterSpacing: "-0.03em" }}>
                {formatPrice(product.price)}
             </div>

             <div style={{ background: "white", padding: "1.5rem", borderRadius: "20px", boxShadow: "var(--shadow-sm)", marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                   <span style={{ fontWeight: "700" }}>Soni:</span>
                   <div style={{ display: "flex", alignItems: "center", background: "var(--gray-100)", borderRadius: "10px", padding: "0.2rem" }}>
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="btn btn-ghost" style={{ padding: "0.5rem" }}>-</button>
                      <span style={{ width: "40px", textAlign: "center", fontWeight: "800" }}>{quantity}</span>
                      <button
                        onClick={() =>
                          setQuantity((q) => {
                            const stock = Number(product.stock_qty ?? 0);
                            if (stock > 0) return Math.min(q + 1, stock);
                            return q + 1;
                          })
                        }
                        className="btn btn-ghost"
                        style={{ padding: "0.5rem" }}
                      >
                        +
                      </button>
                   </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
                   <button
                     onClick={handleAddToCart}
                     disabled={Number(product.stock_qty ?? 0) <= 0}
                     className="btn btn-primary btn-lg"
                     style={{ width: "100%", background: added ? "var(--green)" : "var(--teal)" }}
                   >
                      <ShoppingCart size={20} /> {added ? "Savatda" : "Savatga joylash"}
                   </button>
                   <button onClick={handleOrderNow} className="btn btn-outline btn-lg" style={{ width: "100%" }}>
                      1 klikda xarid qilish
                   </button>
                   
                   {session?.user && (
                    <div style={{ marginTop: "1.25rem" }}>
                       <button 
                          onClick={() => setShowEventPicker(!showEventPicker)} 
                          className="btn btn-ghost"
                          style={{ 
                             width: "100%", color: "var(--teal)", fontWeight: "800", background: "var(--gray-50)", 
                             borderRadius: "12px", border: "1px dashed var(--teal-pale)", gap: "0.5rem", minHeight: "48px" 
                          }}
                       >
                          <Calendar size={18} /> {showEventPicker ? "Yopish" : "Tadbirga biriktirish"}
                       </button>
                       
                       {showEventPicker && (
                          <div style={{ 
                             padding: "0.5rem", background: "white", borderRadius: "12px", 
                             boxShadow: "var(--shadow-md)", marginTop: "0.5rem", border: "1px solid var(--gray-100)" 
                          }}>
                             {userEvents.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  {userEvents.map(ev => (
                                     <button 
                                        key={ev.id} 
                                        onClick={() => handleLinkToEvent(ev.id)} 
                                        style={{ 
                                           width: "100%", textAlign: "left", padding: "0.75rem 1rem", border: "none", 
                                           background: "none", cursor: "pointer", fontWeight: "600", 
                                           color: "var(--gray-600)", borderRadius: "8px" 
                                        }}
                                        className="hover-event-item"
                                      >
                                        {ev.name}
                                     </button>
                                  ))}
                                </div>
                             ) : (
                                <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--gray-500)" }}>
                                   Tadbirlar yo'q. <Link href="/dashboard/tadbirlar" style={{ color: "var(--teal)", fontWeight: "700" }}>Birinchi tadbirni yarating</Link>
                                </div>
                             )}
                          </div>
                       )}
                    </div>
                  )}
                </div>
             </div>

             {/* Description */}
             {product.description && (
                <div style={{ marginBottom: "2rem" }}>
                   <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "1rem" }}>Tavsif</h3>
                   <p style={{ color: "var(--gray-500)", lineHeight: "1.6" }}>{product.description}</p>
                </div>
             )}

             {/* Shop Info */}
             <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem", background: "white", borderRadius: "16px", border: "1px solid var(--gray-100)" }}>
                <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--teal-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                   <Store size={28} color="var(--teal)" />
                </div>
                <div style={{ flex: 1 }}>
                   <div style={{ fontSize: "0.8rem", color: "var(--gray-400)", fontWeight: "600", textTransform: "uppercase", marginBottom: "0.2rem" }}>Do'kon</div>
                   <h4 style={{ margin: 0, fontWeight: "800", fontSize: "1.1rem" }}>{product.shop_name}</h4>
                   <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--gray-500)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                      <MapPin size={14} /> {product.city_name || "Toshkent"}
                   </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
                    <Link href={`/dokonlar/${product.shop_id}`} className="btn btn-ghost">Do'konga o'tish <ArrowRight size={16} /></Link>
                    <button onClick={handleStartChat} className="btn btn-outline" style={{ display: "inline-flex", gap: "0.5rem" }}>
                       <MessageSquare size={18} /> Chat
                    </button>
                 </div>
             </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ marginTop: "5rem", paddingTop: "4rem", borderTop: "1px solid var(--gray-200)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "3rem" }}>
             <MessageSquare size={32} color="var(--teal)" />
             <h2 style={{ fontSize: "2rem", fontWeight: "900", margin: 0 }}>Xaridorlar fikrlari</h2>
             <span className="badge badge-gray" style={{ fontSize: "1rem", padding: "0.4rem 0.8rem" }}>{reviews.length}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "4rem" }} className="reviews-layout">
            {/* Left: Leave Review */}
            <div style={{ background: "white", padding: "2.5rem", borderRadius: "24px", boxShadow: "var(--shadow-sm)", height: "fit-content" }}>
               <h3 style={{ marginBottom: "1.5rem", fontWeight: "800" }}>Sharh qoldirish</h3>
               {session ? (
                 <form onSubmit={submitReview}>
                   <div style={{ marginBottom: "1.5rem" }}>
                     <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Baho (1-5)</label>
                     <div style={{ display: "flex", gap: "0.5rem" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={28} 
                            onClick={() => setReviewRating(star)}
                            fill={reviewRating >= star ? "#FCD34D" : "none"}
                            color={reviewRating >= star ? "#FCD34D" : "var(--gray-300)"}
                            style={{ cursor: "pointer", transition: "all 0.2s" }}
                          />
                        ))}
                     </div>
                   </div>
                   <div style={{ marginBottom: "1.5rem" }}>
                     <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Fikringiz</label>
                     <textarea 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Mahsulot haqida fikrlaringizni yozing..."
                        required
                        style={{ width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid var(--gray-200)", minHeight: "120px", resize: "vertical", fontFamily: "inherit" }}
                     />
                   </div>
                   <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submittingReview}>
                     {submittingReview ? "Yuborilmoqda..." : "Sharh yuborish"}
                   </button>
                 </form>
               ) : (
                 <div style={{ textAlign: "center", padding: "2rem 0" }}>
                   <p style={{ color: "var(--gray-500)", marginBottom: "1rem" }}>Sharh qoldirish uchun tizimga kiring.</p>
                   <Link href="/kirish" className="btn btn-outline">Tizimga kirish</Link>
                 </div>
               )}
            </div>

            {/* Right: Reviews List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
               {reviews.length === 0 ? (
                 <div style={{ background: "var(--gray-100)", padding: "3rem", borderRadius: "24px", textAlign: "center", color: "var(--gray-500)" }}>
                    Hali sharhlar yo'q. Birinchi bo'lib fikr bildiring!
                 </div>
               ) : (
                 reviews.map((r: any) => (
                   <div key={r.id} style={{ background: "white", padding: "2rem", borderRadius: "20px", boxShadow: "var(--shadow-xs)" }}>
                     <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                           <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--teal-pale)", color: "var(--teal-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.1rem" }}>
                              {r.user_name?.[0]?.toUpperCase()}
                           </div>
                           <div>
                             <div style={{ fontWeight: "800", color: "var(--dark)" }}>{r.user_name}</div>
                             <div style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>{new Date(r.created_at).toLocaleDateString()}</div>
                           </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                           {[...Array(5)].map((_, i) => (
                             <Star key={i} size={16} fill={i < r.rating ? "#FCD34D" : "none"} color={i < r.rating ? "#FCD34D" : "var(--gray-200)"} />
                           ))}
                        </div>
                     </div>
                     <p style={{ color: "var(--gray-600)", lineHeight: "1.6", margin: 0 }}>{r.comment}</p>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginTop: "6rem", paddingTop: "4rem", borderTop: "1px solid var(--gray-200)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: "900", margin: 0 }}>O'xshash Sovg'alar</h2>
              <Link href={`/katalog?category=${product.category_slug}`} className="btn btn-ghost" style={{ color: "var(--teal)", fontSize: "1rem" }}>
                 Barchasi <ArrowRight size={18} />
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "2rem" }}>
              {relatedProducts.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <style>{`
        @media(max-width:992px){
          .product-layout-main { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .reviews-layout { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
        }
        .hover-event-item:hover { background: var(--gray-50) !important; color: var(--teal) !important; }
      `}</style>
    </div>
  );
}
