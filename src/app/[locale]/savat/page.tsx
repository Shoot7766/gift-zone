"use client";
import { Link, useRouter } from "@/navigation";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice, DELIVERY_FEE } from "@/lib/utils";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();
  const router = useRouter();
  const t = useTranslations("cart");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");

  if (items.length === 0) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>🛒</div>
          <h2 style={{ fontWeight: "800", marginBottom: "0.75rem" }}>{t("empty")}</h2>
          <p style={{ color: "var(--gray-400)", marginBottom: "2rem" }}>{t("emptyDesc")}</p>
          <Link href="/katalog" className="btn btn-primary btn-lg">
            {tNav("catalog")} <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const total = totalPrice();
  const grandTotal = total + DELIVERY_FEE;

  return (
    <div style={{ padding: "2rem 1.5rem", background: "var(--gray-50)", minHeight: "80vh" }}>
      <div className="container">
        <h1 style={{ marginBottom: "2rem" }}>{t("title")}</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "2rem" }}>
          {/* Items */}
          <div>
            {items.map(item => (
              <div key={item.productId} className="cart-item" style={{
                background: "white", padding: "1.25rem", borderRadius: "var(--r)",
                display: "flex", gap: "1.25rem", alignItems: "center", marginBottom: "1rem",
                boxShadow: "var(--shadow-xs)"
              }}>
                <img
                  src={item.imageUrl || `https://picsum.photos/seed/${item.productId}/160/160`}
                  alt={item.title}
                  style={{ width: "100px", height: "100px", borderRadius: "12px", objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.productId}/160/160`; }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/mahsulot/${item.productId}`} style={{ fontWeight: "700", fontSize: "0.95rem", textDecoration: "none", color: "var(--dark)" }}>
                    {item.title}
                  </Link>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-400)", marginTop: "0.25rem" }}>
                    {item.shopName}
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--gold-dark)", marginTop: "0.5rem" }}>
                    {formatPrice(item.price)}
                  </div>
                  {typeof item.stockQty === "number" && (
                    <div style={{ fontSize: "0.78rem", color: "var(--gray-500)", marginTop: "0.35rem" }}>
                      Omborda: {item.stockQty} ta
                      {item.quantity >= item.stockQty && (
                        <span style={{ color: "var(--orange)", marginLeft: "0.4rem", fontWeight: 700 }}>
                          Maksimal miqdor
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div className="quantity-control" style={{ display: "flex", alignItems: "center", border: "1px solid var(--gray-200)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
                    <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ padding: "0.5rem", background: "none", border: "none", cursor: "pointer" }}>
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: "700", minWidth: "24px", textAlign: "center" }}>{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={typeof item.stockQty === "number" && item.quantity >= item.stockQty}
                      style={{ padding: "0.5rem", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div style={{ fontWeight: "700", minWidth: "100px", textAlign: "right" }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>

                  <button onClick={() => removeItem(item.productId)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)", padding: "0.25rem" }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            <button onClick={clearCart} className="btn btn-ghost" style={{ color: "var(--red)", marginTop: "0.5rem" }}>
              <Trash2 size={16} /> {t("remove")}
            </button>
          </div>

          {/* Summary */}
          <div>
            <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", boxShadow: "var(--shadow)", position: "sticky", top: "88px" }}>
              <h3 style={{ fontWeight: "800", marginBottom: "1.5rem" }}>{tCommon("orderSummary") || "Buyurtma xulasasi"}</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--gray-600)" }}>{tCommon("category")} ({items.reduce((s, i) => s + i.quantity, 0)} ta)</span>
                  <span style={{ fontWeight: "600" }}>{formatPrice(total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--gray-600)" }}>{t("deliveryFee")}</span>
                  <span style={{ fontWeight: "600" }}>{formatPrice(DELIVERY_FEE)}</span>
                </div>
              </div>

              <div style={{ height: "1px", background: "var(--gray-100)", marginBottom: "1.5rem" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <span style={{ fontWeight: "700", fontSize: "1.1rem" }}>{t("total")}</span>
                <span style={{ fontWeight: "900", fontSize: "1.4rem", color: "var(--gold-dark)" }}>{formatPrice(grandTotal)}</span>
              </div>

              <button onClick={() => router.push("/buyurtma")} className="btn btn-primary btn-lg" style={{ width: "100%" }}>
                {t("checkout")} <ArrowRight size={18} />
              </button>

              <Link href="/katalog" className="btn btn-ghost" style={{ width: "100%", marginTop: "0.75rem", textAlign: "center", textDecoration: "none" }}>
                {t("continueShopping")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          div[style*="gridTemplateColumns: '1fr 360px'"]{grid-template-columns:1fr!important}
        }
        .cart-item img {
          transition: transform 0.3s ease;
        }
        .cart-item:hover img {
          transform: scale(1.05);
        }
        .qty-btn:hover {
          background: var(--gray-50) !important;
        }
      `}</style>
    </div>
  );
}
