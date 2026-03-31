"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { formatPrice, formatDateTime, ORDER_STATUS_UZ, ORDER_STATUS_BG, FULFILLMENT_UZ } from "@/lib/utils";
import { Package, Clock, ChevronDown, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

function providerActions(order: { status: string; fulfillment_type?: string | null }) {
  const ft = order.fulfillment_type === "pickup" ? "pickup" : "shop_delivery";
  const s = order.status;
  if (s === "pending") {
    return [
      { label: "Qabul qilish", status: "accepted" },
      { label: "Rad etish", status: "cancelled", danger: true },
    ];
  }
  if (s === "accepted") return [{ label: "Tayyorlashni boshlash", status: "preparing" }];
  if (s === "preparing") {
    if (ft === "pickup") return [{ label: "Olib ketishga tayyor", status: "ready_for_pickup" }];
    return [{ label: "Yo'lga chiqardi", status: "out_for_delivery" }];
  }
  if (s === "ready_for_pickup" || s === "out_for_delivery") {
    return [{ label: "Yetkazildi", status: "delivered" }];
  }
  return [];
}

export default function ProviderOrdersPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    // Find the shop belonging to this provider
    fetch("/api/shops").then(r => r.json()).then(d => {
      const myShop = d.shops?.find((s: any) => s.user_id === session!.user.id);
      if (myShop) { setShopId(myShop.id); loadOrders(myShop.id); }
      else setLoading(false);
    });
  }, [session]);

  const loadOrders = (sid: string) => {
    setLoading(true);
    fetch(`/api/orders?shopId=${sid}`).then(r => r.json()).then(d => {
      setOrders(d.orders || []);
      setLoading(false);
    });
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast(`Holat yangilandi: ${ORDER_STATUS_UZ[status]}`, "success");
    } else toast("Xatolik yuz berdi", "error");
    setUpdating(null);
  };

  const filtered = orders.filter(o => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (search && !o.recipient_name?.toLowerCase().includes(search.toLowerCase()) &&
        !o.delivery_address?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const cleanNote = (note?: string | null) => {
    if (!note) return "";
    return note.replace(/\s*\[geo:[^\]]+\]\s*/gi, " ").trim();
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
      <div style={{ fontSize: "3rem", animation: "float 2s ease-in-out infinite" }}>📦</div>
    </div>
  );

  if (!shopId) return (
    <div className="empty-state">
      <div className="empty-emoji">🏪</div>
      <h3 className="empty-title">Do'kon yaratilmagan</h3>
      <p className="empty-desc">Buyurtmalarni ko'rish uchun avval do'kon profilingizni to'ldiring</p>
      <a href="/provider/dokon" className="btn btn-primary">Do'kon yaratish</a>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontWeight: "800" }}>Buyurtmalar</h1>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {Object.entries(ORDER_STATUS_UZ).map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(filterStatus === val ? "" : val)}
              className="badge"
              style={{
                cursor: "pointer", border: "none",
                ...(filterStatus === val
                  ? { ...ORDER_STATUS_BG[val], boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }
                  : { background: "var(--gray-100)", color: "var(--gray-600)" })
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1.5rem", maxWidth: "360px" }}>
        <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
        <input type="text" className="form-input" placeholder="Qabul qiluvchi yoki manzil..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: "2.75rem" }} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Jami", count: orders.length, bg: "#F3F4F6", color: "#374151" },
          { label: "Kutmoqda", count: orders.filter(o => o.status === "pending").length, bg: "#FEF3C7", color: "#92400E" },
          { label: "Faol", count: orders.filter(o => ["accepted","preparing","ready_for_pickup","out_for_delivery"].includes(o.status)).length, bg: "#DBEAFE", color: "#1E40AF" },
          { label: "Yetkazildi", count: orders.filter(o => o.status === "delivered").length, bg: "#D1FAE5", color: "#065F46" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: "var(--r-lg)", padding: "1.25rem", boxShadow: "var(--shadow-xs)", display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "var(--r)", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "1.25rem", color: s.color }}>
              {s.count}
            </div>
            <span style={{ fontWeight: "700", fontSize: "0.875rem", color: "var(--gray-600)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">📭</div>
          <h3 className="empty-title">Buyurtmalar yo'q</h3>
          <p className="empty-desc">Hali hech kim buyurtma bermagan yoki filtr bo'sh natija ko'rsatyapti</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map(order => {
            const actions = providerActions(order);
            const statusStyle = ORDER_STATUS_BG[order.status] || { bg: "#F3F4F6", color: "#374151" };
            const isUpdating = updating === order.id;
            const ftKey = order.fulfillment_type === "pickup" ? "pickup" : order.fulfillment_type === "courier_platform" ? "courier_platform" : "shop_delivery";

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                style={{ background: "var(--card-bg)", borderRadius: "var(--r-lg)", padding: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.18)", border: "1px solid var(--gray-100)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.375rem" }}>
                      <span style={{ fontWeight: "800", fontSize: "0.875rem", color: "var(--gray-400)" }}>#{order.id.slice(-8).toUpperCase()}</span>
                      <span style={{ borderRadius: "var(--r-full)", padding: "0.25rem 0.75rem", fontSize: "0.78rem", fontWeight: "700", background: statusStyle.bg, color: statusStyle.color }}>
                        {ORDER_STATUS_UZ[order.status] || order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--gray-500)" }}>
                      <Clock size={13} style={{ verticalAlign: "middle" }} /> {formatDateTime(order.created_at)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: "0.35rem" }}>
                      Buyurtma raqami: <strong>#{order.id.slice(-8).toUpperCase()}</strong>
                    </div>
                    <div style={{ marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "800", padding: "0.2rem 0.55rem", borderRadius: "999px", background: "#E0F2FE", color: "#0369A1" }}>
                        {FULFILLMENT_UZ[ftKey] || FULFILLMENT_UZ.shop_delivery}
                      </span>
                    </div>
                  </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "900", fontSize: "1.25rem", color: "var(--teal)" }}>
                        {formatPrice(order.total_amount + order.delivery_fee)}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>
                        Yetkazish: {formatPrice(order.delivery_fee)}
                      </div>
                    </div>
                  </div>

                {/* Recipient info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                   <div style={{ padding: "1rem", background: "var(--gray-50)", borderRadius: "var(--r)", border: "1px solid var(--gray-100)" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>Qabul qiluvchi</div>
                      <div style={{ fontWeight: "800", fontSize: "1rem", marginBottom: "0.25rem" }}>{order.recipient_name}</div>
                      <div style={{ color: "var(--teal)", fontWeight: "700" }}>{order.recipient_phone}</div>
                   </div>
                   <div style={{ padding: "1rem", background: "var(--gray-50)", borderRadius: "var(--r)", border: "1px solid var(--gray-100)" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>Manzil</div>
                      <div style={{ fontSize: "0.9rem", lineHeight: "1.4", fontWeight: "600" }}>{order.delivery_address}</div>
                      {order.delivery_lat != null && order.delivery_lng != null && (
                        <div style={{ marginTop: "0.55rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <a
                            href={`https://maps.google.com/?q=${order.delivery_lat},${order.delivery_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ border: "1px solid var(--gray-200)" }}
                          >
                            Xaritada ochish
                          </a>
                        </div>
                      )}
                   </div>
                </div>

                {/* Buyurtma rasmi */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                    Buyurtma rasmi
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {(order.items || []).slice(0, 4).map((item: any, idx: number) => (
                      <div
                        key={`${item.id || item.product_id || idx}`}
                        style={{
                          width: "62px",
                          height: "62px",
                          borderRadius: "10px",
                          overflow: "hidden",
                          border: "1px solid var(--gray-200)",
                          background: "var(--gray-100)",
                        }}
                        title={item.title || "Mahsulot"}
                      >
                        <img
                          src={item.image_url || `https://picsum.photos/seed/${item.product_id || idx}/62/62`}
                          alt={item.title || "Mahsulot rasmi"}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>
                    ))}
                    {(!order.items || order.items.length === 0) && (
                      <div style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>Rasm mavjud emas</div>
                    )}
                  </div>
                </div>

                {/* Order items */}
                {order.items?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    {order.items.map((item: any) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", fontSize: "0.875rem", borderBottom: "1px dashed var(--gray-100)" }}>
                        <span>{item.title} <span style={{ color: "var(--gray-400)" }}>×{item.quantity}</span></span>
                        <span style={{ fontWeight: "700" }}>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note and Greetings */}
                {(cleanNote(order.note) || order.greeting_text || order.greeting_url) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                    {cleanNote(order.note) && (
                      <div style={{ background: "#FFFBEB", borderRadius: "var(--r-sm)", padding: "0.625rem 0.875rem", fontSize: "0.875rem", border: "1px solid #FDE68A", color: "#78350F" }}>
                        💬 <em>{cleanNote(order.note)}</em>
                      </div>
                    )}
                    
                    {(order.greeting_text || order.greeting_url) && (
                      <div style={{ background: "var(--teal-pale)", borderRadius: "var(--r-sm)", padding: "1rem", border: "1px dashed var(--teal)", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "800", color: "var(--teal)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>
                            🎁 Maxsus Tabriknoma
                          </div>
                          {order.greeting_text && (
                            <div style={{ fontSize: "0.9rem", color: "var(--dark)", marginBottom: "0.5rem", fontStyle: "italic" }}>
                              "{order.greeting_text}"
                            </div>
                          )}
                          {order.greeting_url && (
                            <a href={order.greeting_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem", color: "var(--teal)", textDecoration: "underline", wordBreak: "break-all" }}>
                              {order.greeting_url}
                            </a>
                          )}
                        </div>
                        <div style={{ width: "80px", height: "80px", background: "white", padding: "4px", borderRadius: "8px", border: "1px solid var(--gray-200)", flexShrink: 0 }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(order.greeting_url || order.greeting_text || "")}`}
                            alt="QR Code"
                            style={{ width: "100%", height: "100%", display: "block" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Buyurtma batafsili */}
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "0.9rem 1rem",
                    borderRadius: "12px",
                    border: "1px solid var(--gray-200)",
                    background: "var(--card-bg)",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--gray-500)", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                    Buyurtma batafsili
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.6rem" }}>
                    <div style={{ fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--gray-500)" }}>Buyurtma #:</span>{" "}
                      <strong>{order.id.slice(-8).toUpperCase()}</strong>
                    </div>
                    <div style={{ fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--gray-500)" }}>To'lov turi:</span>{" "}
                      <strong>{order.payment_method || "cash"}</strong>
                    </div>
                    <div style={{ fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--gray-500)" }}>To'lov holati:</span>{" "}
                      <strong>{order.payment_status || "unpaid"}</strong>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {actions.map((a) => (
                    <button
                      key={a.status + a.label}
                      onClick={() => updateStatus(order.id, a.status)}
                      className="btn btn-sm"
                      disabled={isUpdating}
                      style={
                        a.danger
                          ? { background: "var(--red-pale)", color: "var(--red)", border: "none", cursor: "pointer" }
                          : { background: "var(--teal)", color: "white", border: "none" }
                      }
                    >
                      {isUpdating ? "..." : a.label}
                    </button>
                  ))}
                  {order.recipient_phone && (
                    <a href={`tel:${order.recipient_phone}`} className="btn btn-ghost btn-sm" style={{ border: "1px solid var(--gray-200)" }}>
                      📞 Qo'ng'iroq
                    </a>
                  )}
                  <button onClick={() => setSelectedOrder(order)} className="btn btn-ghost btn-sm" style={{ border: "1px solid var(--gray-200)" }}>
                    👁️ Batafsil
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }} onClick={() => setSelectedOrder(null)}>
          <div style={{ background: "white", width: "100%", maxWidth: "600px", borderRadius: "24px", maxHeight: "90vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
             <button onClick={() => setSelectedOrder(null)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "var(--gray-50)", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}>×</button>
             
             <div style={{ padding: "2rem" }}>
                <h2 style={{ fontWeight: "900", marginBottom: "1.5rem" }}>Buyurtma #{selectedOrder.id.slice(-8).toUpperCase()}</h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                   {selectedOrder.items?.map((item: any) => (
                     <div key={item.id} style={{ display: "flex", gap: "1rem", alignItems: "center", borderBottom: "1px solid var(--gray-50)", paddingBottom: "1rem" }}>
                        <img src={item.image_url || `https://picsum.photos/seed/${item.product_id}/60/60`} style={{ width: "60px", height: "60px", borderRadius: "10px", objectFit: "cover" }} />
                        <div style={{ flex: 1 }}>
                           <div style={{ fontWeight: "700" }}>{item.title}</div>
                           <div style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>{item.quantity} x {formatPrice(item.price)}</div>
                        </div>
                        <div style={{ fontWeight: "800" }}>{formatPrice(item.price * item.quantity)}</div>
                     </div>
                   ))}
                </div>

                <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "2px solid var(--gray-50)" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ color: "var(--gray-500)" }}>Mahsulotlar:</span>
                      <span style={{ fontWeight: "700" }}>{formatPrice(selectedOrder.total_amount)}</span>
                   </div>
                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <span style={{ color: "var(--gray-500)" }}>Yetkazish:</span>
                      <span style={{ fontWeight: "700" }}>{formatPrice(selectedOrder.delivery_fee)}</span>
                   </div>
                   <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.25rem" }}>
                      <span style={{ fontWeight: "900" }}>Jami:</span>
                      <span style={{ fontWeight: "900", color: "var(--gold-dark)" }}>{formatPrice(selectedOrder.total_amount + selectedOrder.delivery_fee)}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
