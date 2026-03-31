"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { formatPrice, getOrderGrossTotal, ORDER_STATUS_UZ, ORDER_STATUS_COLORS, PAYMENT_STATUS_UZ, PAYMENT_STATUS_COLORS, FULFILLMENT_UZ } from "@/lib/utils";
import { Package, Calendar, MapPin, Phone, CreditCard, ChevronRight, Star, X, Users, Copy, CheckCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalLoader } from "@/components/Loader";
import { OrderStepper } from "@/components/orders/OrderStepper";

function isGroupOrder(order: any) {
  return order.is_group_gifting === 1 || order.is_group_gifting === true;
}

export default function CustomerOrders() {
  const locale = useLocale();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{ orderId: string; productId: string; productTitle: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set());
  const [origin, setOrigin] = useState("");
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const refetchOrders = useCallback(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        if (d.orders) setOrders(d.orders);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /** Birgalikda to'lov: admin tasdiqlaganda progress yangilansin */
  useEffect(() => {
    const needPoll = orders.some((o) => isGroupOrder(o) && o.payment_status !== "paid");
    if (!needPoll) return;
    const id = setInterval(refetchOrders, 12000);
    return () => clearInterval(id);
  }, [orders, refetchOrders]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: reviewModal.productId,
          orderId: reviewModal.orderId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setReviewedItems(prev => new Set([...prev, reviewModal.productId + reviewModal.orderId]));
        setReviewModal(null);
        setReviewRating(5);
        setReviewComment("");
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontWeight: "800", marginBottom: "1.5rem" }}>Buyurtmalarim</h1>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <GlobalLoader />
        </div>
      ) : orders.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ background: "white", borderRadius: "var(--r-xl)", padding: "5rem 2rem", textAlign: "center", boxShadow: "var(--shadow-xs)" }}
        >
          <div style={{ width: "100px", height: "100px", background: "var(--teal-pale)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem" }}>
            <Package size={48} color="var(--teal)" />
          </div>
          <h3 style={{ fontSize: "1.75rem", fontWeight: "900", marginBottom: "0.75rem" }}>Hali buyurtma yo&apos;q</h3>
          <p style={{ color: "var(--gray-500)", marginBottom: "2.5rem", maxWidth: "400px", margin: "0 auto 2.5rem" }}>Katalogdan mahsulot tanlang va birinchi buyurtmangizni amalga oshiring.</p>
          <Link href="/katalog" className="btn btn-primary btn-lg" style={{ fontWeight: "700" }}>Katalogga o&apos;tish</Link>
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {orders.map(order => (
            <motion.div 
              key={order.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -4, boxShadow: "var(--shadow-sm)" }}
              style={{ background: "white", borderRadius: "var(--r-lg)", padding: "2rem", boxShadow: "var(--shadow-xs)", transition: "all 0.2s" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "900", fontSize: "1.1rem", color: "var(--dark)", fontFamily: "monospace" }}>#{order.id.slice(-8).toUpperCase()}</span>
                    {isGroupOrder(order) && (
                      <span style={{ fontSize: "0.78rem", fontWeight: "800", padding: "0.3rem 0.65rem", borderRadius: "999px", background: "var(--gold-pale)", color: "var(--gold-dark)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <Users size={12} />
                        Birgalikda to&apos;lov
                      </span>
                    )}
                    <span style={{ fontSize: "0.78rem", fontWeight: "800", padding: "0.3rem 0.65rem", borderRadius: "999px", background: "#E0F2FE", color: "#0369A1" }}>
                      {FULFILLMENT_UZ[order.fulfillment_type === "pickup" ? "pickup" : "shop_delivery"]}
                    </span>
                    <span className={`status-badge ${ORDER_STATUS_COLORS[order.status]}`} style={{ fontWeight: "700", padding: "0.35rem 0.85rem" }}>
                      {ORDER_STATUS_UZ[order.status]}
                    </span>
                    <span className={`status-badge ${PAYMENT_STATUS_COLORS[order.payment_status]}`} style={{ fontWeight: "700", padding: "0.35rem 0.85rem" }}>
                      {PAYMENT_STATUS_UZ[order.payment_status]}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", fontSize: "0.9rem", color: "var(--gray-500)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Package size={14} color="var(--teal)" /> <strong>{order.shop_name}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Calendar size={14} /> {new Date(order.created_at).toLocaleString("uz-UZ", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--teal)", letterSpacing: "-0.02em" }}>
                    {formatPrice(order.total_amount)}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--gray-400)", fontWeight: "600" }}>
                    + {formatPrice(order.delivery_fee || 0)} yetkazish
                  </div>
                </div>
              </div>

              {isGroupOrder(order) && (() => {
                const gross = getOrderGrossTotal(order);
                const payments = order.payments || [];
                const paidApproved = payments
                  .filter((p: { status: string }) => p.status === "success")
                  .reduce((acc: number, p: { amount: number }) => acc + (p.amount || 0), 0);
                const pendingReview = payments
                  .filter((p: { status: string }) => p.status === "pending")
                  .reduce((acc: number, p: { amount: number }) => acc + (p.amount || 0), 0);
                const progressPct = gross > 0 ? Math.min(100, Math.round((paidApproved / gross) * 100)) : 0;
                const shareUrl = origin ? `${origin}/${locale}/to'lov/${order.id}` : "";
                return (
                  <div
                    style={{
                      marginBottom: "1.5rem",
                      padding: "1.5rem",
                      background: "linear-gradient(135deg, var(--gold-pale) 0%, #fff8e1 100%)",
                      borderRadius: "20px",
                      border: "1px solid rgba(212, 175, 55, 0.35)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "800", color: "var(--dark)" }}>
                        <Users size={22} color="var(--gold-dark)" />
                        To&apos;lov yig&apos;ilishi (admin tasdiqlangan)
                      </div>
                      <button
                        type="button"
                        onClick={() => refetchOrders()}
                        className="btn btn-ghost btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem" }}
                      >
                        <RefreshCw size={14} /> Yangilash
                      </button>
                    </div>
                    <div style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--gray-700)" }}>
                      <span style={{ fontWeight: "700", color: "var(--teal-dark)" }}>{formatPrice(paidApproved)}</span>
                      {" "}yig&apos;ildi / jami{" "}
                      <span style={{ fontWeight: "800" }}>{formatPrice(gross)}</span>
                      {" "}
                      <span style={{ color: "var(--gray-500)", fontWeight: "600" }}>({progressPct}%)</span>
                    </div>
                    <div style={{ width: "100%", height: "14px", background: "rgba(255,255,255,0.7)", borderRadius: "99px", overflow: "hidden", border: "1px solid rgba(212, 175, 55, 0.35)", marginBottom: "0.5rem" }}>
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, var(--teal), var(--gold-dark))",
                          borderRadius: "99px",
                          transition: "width 0.5s ease-out",
                        }}
                      />
                    </div>
                    {pendingReview > 0 && (
                      <div style={{ fontSize: "0.82rem", color: "var(--orange)", fontWeight: "600", marginBottom: "1rem" }}>
                        Admin tasdiqini kutilmoqda: {formatPrice(pendingReview)} (shkala faqat tasdiqlangandan keyin to&apos;ldiriladi)
                      </div>
                    )}
                    {paidApproved >= gross && gross > 0 && (
                      <div style={{ fontSize: "0.82rem", color: "var(--green)", fontWeight: "700", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <CheckCircle size={16} /> To&apos;lov to&apos;liq yig&apos;ildi
                      </div>
                    )}
                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--gray-500)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                      Do&apos;stlaringizga yuboriladigan havola
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        readOnly
                        value={shareUrl || "…"}
                        className="form-input"
                        style={{ flex: 1, minWidth: "200px", background: "white", fontSize: "0.85rem" }}
                      />
                      <button
                        type="button"
                        disabled={!shareUrl}
                        onClick={() => {
                          if (!shareUrl) return;
                          navigator.clipboard.writeText(shareUrl);
                          setCopiedLinkId(order.id);
                          setTimeout(() => setCopiedLinkId(null), 2000);
                        }}
                        className="btn btn-outline"
                        style={{ padding: "0 1rem" }}
                      >
                        {copiedLinkId === order.id ? <CheckCircle size={18} color="var(--green)" /> : <Copy size={18} />}
                      </button>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--gray-600)", marginTop: "0.75rem", lineHeight: 1.45, marginBottom: 0 }}>
                      Bu havolani nusxalab yuboring. Har bir to&apos;lov admin panelda tasdiqlanganda, yuqoridagi shkala avtomatik yangilanadi (yoki “Yangilash”ni bosing).
                    </p>
                  </div>
                );
              })()}

              {/* Order Progress Stepper [NEW] */}
              <div style={{ margin: "1rem 0 2rem 0", padding: "1.5rem", background: "var(--gray-50)", borderRadius: "20px" }}>
                 <OrderStepper status={order.status} fulfillmentType={order.fulfillment_type} />
              </div>

              {/* Order items stagger */}
              {order.items && order.items.length > 0 && (
                <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--gray-100)", paddingTop: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {order.items.map((item: any) => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ position: "relative", width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", background: "var(--gray-50)" }}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}/80/80`; }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Package size={24} color="var(--gray-200)" />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--dark)" }}>{item.title}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", fontWeight: "600" }}>
                            {item.quantity} dona × {formatPrice(item.price)}
                          </div>
                        </div>
                        <div style={{ fontWeight: "800", fontSize: "1rem", color: "var(--dark)" }}>
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery info card */}
              <div style={{ marginTop: "1.5rem", padding: "1.25rem", background: "var(--gray-50)", borderRadius: "var(--r)", fontSize: "0.9rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {order.fulfillment_type === "pickup" ? (
                  <div style={{ display: "flex", gap: "0.75rem", gridColumn: "1 / -1" }}>
                    <MapPin size={18} color="var(--teal)" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ color: "var(--gray-500)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Olib ketish manzili</div>
                      <div style={{ fontWeight: "700" }}>{order.delivery_address}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <MapPin size={18} color="var(--teal)" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ color: "var(--gray-500)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Yetkazish manzili</div>
                      <div style={{ fontWeight: "700" }}>{order.delivery_address} {order.city_name ? `(${order.city_name})` : ""}</div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <Phone size={18} color="var(--teal)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ color: "var(--gray-500)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Qabul qiluvchi</div>
                    <div style={{ fontWeight: "700" }}>{order.recipient_name} · {order.recipient_phone}</div>
                  </div>
                </div>
                {(order.delivery_date || order.delivery_time) && (
                  <div style={{ gridColumn: "1/-1", display: "flex", gap: "0.75rem", borderTop: "1px solid var(--gray-200)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                    <Calendar size={18} color="var(--teal)" />
                    <div>
                      <span style={{ color: "var(--gray-500)", fontWeight: "600" }}>Reja:</span>{" "}
                      {order.delivery_date ? `${order.delivery_date}` : ""}
                      {order.delivery_time && (
                        <span> {new Date(order.delivery_time).toLocaleString("uz-UZ")}</span>
                      )}
                    </div>
                  </div>
                )}
                {order.note && (
                  <div style={{ gridColumn: "1/-1", fontSize: "0.85rem", color: "var(--gray-500)", background: "#FFFBEB", padding: "0.5rem 1rem", borderRadius: "8px", borderLeft: "4px solid var(--gold)" }}>
                    <strong>Izoh:</strong> {order.note}
                  </div>
                )}
              </div>

              {/* Review button for delivered orders */}
              {order.status === "delivered" && order.items?.length > 0 && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--gray-100)", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--gray-400)", fontWeight: "700" }}>Baho bering:</span>
                  {order.items.map((item: any) => {
                    const alreadyReviewed = reviewedItems.has(item.product_id + order.id);
                    return (
                      <button
                        key={item.id}
                        disabled={alreadyReviewed}
                        onClick={() => setReviewModal({ orderId: order.id, productId: item.product_id, productTitle: item.title })}
                        className="btn btn-sm"
                        style={{
                          background: alreadyReviewed ? "var(--gray-100)" : "#FFFBEB",
                          color: alreadyReviewed ? "var(--gray-400)" : "#B45309",
                          border: "1px solid #FEF3C7",
                          fontWeight: "700", fontSize: "0.8rem"
                        }}
                      >
                        <Star size={13} fill={alreadyReviewed ? "currentColor" : "none"} />
                        {alreadyReviewed ? "Sharh qoldirildi" : item.title}
                      </button>
                    );
                  })}
                </div>
              )}

            </motion.div>
          ))}
        </motion.div>
      )}

      {/* REVIEW MODAL */}
      {reviewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1.5rem" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ background: "white", borderRadius: "32px", padding: "2.5rem", width: "100%", maxWidth: "460px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.4rem", fontWeight: "900" }}>Sharh qoldirish</h3>
              <button onClick={() => setReviewModal(null)} style={{ background: "none", border: "none", color: "var(--gray-400)", cursor: "pointer" }}><X size={24} /></button>
            </div>
            <div style={{ fontSize: "0.95rem", color: "var(--gray-600)", marginBottom: "1.5rem", fontWeight: "600", padding: "0.75rem 1rem", background: "var(--gray-50)", borderRadius: "10px" }}>
              ⭐ "{reviewModal.productTitle}"
            </div>

            <form onSubmit={submitReview} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.75rem", color: "var(--gray-500)" }}>Baholang</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", transition: "transform 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.25)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <Star size={40} fill={star <= reviewRating ? "#F59E0B" : "none"} color={star <= reviewRating ? "#F59E0B" : "#D1D5DB"} />
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--gray-400)", marginTop: "0.5rem" }}>
                  {["", "Yomon", "Qoniqarsiz", "O'rtacha", "Yaxshi", "Ajoyib!"][reviewRating]}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.5rem", color: "var(--gray-500)" }}>Izoh (Ixtiyoriy)</label>
                <textarea
                  placeholder="Mahsulot haqida fikringizni yozing..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid var(--gray-200)", fontSize: "0.95rem", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>

              <button type="submit" disabled={reviewSubmitting} className="btn btn-primary btn-lg" style={{ borderRadius: "16px", width: "100%", marginTop: "0.5rem" }}>
                {reviewSubmitting ? "Yuborilmoqda..." : "⭐ Sharh yuborish"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
