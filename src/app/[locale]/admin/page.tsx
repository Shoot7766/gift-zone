"use client";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, Link } from "@/navigation";
import { GlobalLoader } from "@/components/Loader";
import { formatPrice, ORDER_STATUS_UZ, ORDER_STATUS_BG, PAYMENT_STATUS_UZ } from "@/lib/utils";
import { Users, Store, Package, CreditCard, BarChart2, ShieldCheck, Ban, Trash2, CheckCircle, MessageCircle, Clock, AlertTriangle, Image as ImageIcon, DollarSign, XCircle } from "lucide-react";

type Tab =
  | "stats"
  | "users"
  | "shops"
  | "orders"
  | "payments"
  | "chats"
  | "moliya"
  | "broadcast"
  | "audit"
  | "ai_queries";

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stats");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    targetRole: "all",
  });
  const [auditFilters, setAuditFilters] = useState({
    search: "",
    actionType: "all",
    adminId: "all",
    fromDate: "",
    toDate: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/kirish");
    if (status === "authenticated" && session?.user?.role !== "admin") router.push("/");
  }, [status, session, router]);

  const [aiQueries, setAiQueries] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetch("/api/admin")
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok || d?.success === false) {
            throw new Error(d?.error || "Admin ma'lumotlari yuklanmadi");
          }
          setData(d);
          setLoadError("");
          setLoading(false);
        })
        .catch((e) => {
          console.error("ADMIN_PAGE_LOAD_ERROR", e);
          setData(null);
          setLoadError("Admin ma'lumotlarini yuklashda xatolik. Qayta kirib ko'ring.");
          setLoading(false);
        });
      fetch("/api/admin/broadcast")
        .then((r) => r.json())
        .then((d) => setAnnouncements(d.announcements || []))
        .catch(() => {});
      fetch("/api/ai/chat")
        .then((r) => r.json())
        .then((d) => setAiQueries(d.queries || []))
        .catch(() => {});
    }
  }, [session]);

  const action = async (type: string, id: string, act: string) => {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, action: act }),
    });
    const res = await fetch("/api/admin");
    const d = await res.json();
    setData(d);
  };

  const createBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(broadcastForm),
    });
    if (res.ok) {
      setBroadcastForm({ title: "", message: "", targetRole: "all" });
      const refreshed = await fetch("/api/admin/broadcast").then((r) => r.json());
      setAnnouncements(refreshed.announcements || []);
    }
  };

  const toggleBroadcast = async (id: string, isActive: boolean) => {
    await fetch("/api/admin/broadcast", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    const refreshed = await fetch("/api/admin/broadcast").then((r) => r.json());
    setAnnouncements(refreshed.announcements || []);
  };

  const navTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "stats", label: "Statistika", icon: <BarChart2 size={18} /> },
    { id: "users", label: "Foydalanuvchilar", icon: <Users size={18} /> },
    { id: "shops", label: "Do'konlar", icon: <Store size={18} /> },
    { id: "orders", label: "Buyurtmalar", icon: <Package size={18} /> },
    { id: "payments", label: "P2P To'lovlar", icon: <CreditCard size={18} /> },
    { id: "chats", label: "Suhbatlar", icon: <MessageCircle size={18} /> },
    { id: "moliya", label: "Moliya", icon: <DollarSign size={18} /> },
    { id: "broadcast", label: "Xabar yuborish", icon: <MessageCircle size={18} /> },
    { id: "ai_queries", label: "AI So'rovlar", icon: <MessageCircle size={18} /> },
    { id: "audit", label: "Audit log", icon: <Clock size={18} /> },
  ];

  const auditLogs = useMemo(() => data?.auditLogs || [], [data?.auditLogs]);
  const auditActionTypes: string[] = Array.from(
    new Set(auditLogs.map((log: any) => String(log.action_type || "")))
  ).filter(Boolean) as string[];
  const auditAdmins: { id: string; label: string }[] = Array.from(
    new Map(
      auditLogs
        .filter((log: any) => log.admin_user_id)
        .map((log: any) => [String(log.admin_user_id), { id: String(log.admin_user_id), label: log.admin_name || log.admin_email || "Noma'lum admin" }])
    ).values()
  ) as { id: string; label: string }[];
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log: any) => {
      const query = auditFilters.search.trim().toLowerCase();
      const textBlob = `${log.action_type || ""} ${log.target_type || ""} ${log.target_id || ""} ${log.note || ""} ${log.admin_name || ""} ${log.admin_email || ""}`.toLowerCase();
      const searchOk = !query || textBlob.includes(query);
      const actionOk = auditFilters.actionType === "all" || String(log.action_type) === auditFilters.actionType;
      const adminOk = auditFilters.adminId === "all" || String(log.admin_user_id) === auditFilters.adminId;

      const created = new Date(log.created_at);
      const fromOk = !auditFilters.fromDate || created >= new Date(`${auditFilters.fromDate}T00:00:00`);
      const toOk = !auditFilters.toDate || created <= new Date(`${auditFilters.toDate}T23:59:59`);
      return searchOk && actionOk && adminOk && fromOk && toOk;
    });
  }, [auditLogs, auditFilters]);

  if (status === "loading" || loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--warm-white)" }}>
      <GlobalLoader />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--warm-white)", paddingBottom: "4rem", color: "var(--dark)" }}>
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", padding: "2rem 1.5rem" }}>
        <div className="container" style={{ maxWidth: "1200px" }}>
          <h1 style={{ color: "white", fontWeight: "800", marginBottom: "1.5rem" }}>⚙️ Boshqaruv paneli</h1>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {navTabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="btn btn-sm"
                style={{
                  background: tab === t.id ? "var(--gold)" : "rgba(255,255,255,0.12)",
                  color: tab === t.id ? "#0f172a" : "rgba(255,255,255,0.95)",
                  border: tab === t.id ? "none" : "1px solid rgba(255,255,255,0.14)",
                  fontWeight: tab === t.id ? "800" : "600"
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: "1200px", padding: "2rem 1.5rem" }}>
        {loadError && (
          <div
            style={{
              background: "var(--red-pale)",
              color: "#991B1B",
              border: "1px solid rgba(153,27,27,0.2)",
              borderRadius: "12px",
              padding: "0.85rem 1rem",
              marginBottom: "1rem",
              fontWeight: 700,
            }}
          >
            {loadError}
          </div>
        )}

        <div
          className="admin-quick-actions"
          style={{
            background: "var(--card-bg)",
            borderRadius: "16px",
            padding: "1rem",
            marginBottom: "1.25rem",
            boxShadow: "var(--shadow-xs)",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "0.75rem",
          }}
        >
          <button onClick={() => setTab("payments")} className="btn btn-ghost" style={{ justifyContent: "center" }}>
            P2P tekshirish
          </button>
          <button onClick={() => setTab("shops")} className="btn btn-ghost" style={{ justifyContent: "center" }}>
            Do'konlar nazorati
          </button>
          <button onClick={() => setTab("moliya")} className="btn btn-ghost" style={{ justifyContent: "center" }}>
            Moliya
          </button>
          <button onClick={() => setTab("broadcast")} className="btn btn-ghost" style={{ justifyContent: "center" }}>
            Ommaviy xabar
          </button>
          <button onClick={() => setTab("audit")} className="btn btn-ghost" style={{ justifyContent: "center" }}>
            Audit log
          </button>
        </div>
        
        {/* STATS */}
        {tab === "stats" && data?.stats && (
           <>
             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
               <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
                 <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", fontWeight: "700", textTransform: "uppercase" }}>Jami Foydalanuvchilar</div>
                 <div style={{ fontSize: "2rem", fontWeight: "900", color: "var(--teal)", marginTop: "0.5rem" }}>{data.stats.totalUsers}</div>
               </div>
               <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
                 <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", fontWeight: "700", textTransform: "uppercase" }}>Jami Do'konlar</div>
                 <div style={{ fontSize: "2rem", fontWeight: "900", color: "var(--blue)", marginTop: "0.5rem" }}>{data.stats.totalShops}</div>
               </div>
               <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
                 <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", fontWeight: "700", textTransform: "uppercase" }}>Jami Buyurtmalar</div>
                 <div style={{ fontSize: "2rem", fontWeight: "900", color: "var(--gold-dark)", marginTop: "0.5rem" }}>{data.stats.totalOrders}</div>
               </div>
               <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
                 <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", fontWeight: "700", textTransform: "uppercase" }}>Jami Sovg'alar</div>
                 <div style={{ fontSize: "2rem", fontWeight: "900", color: "var(--purple)", marginTop: "0.5rem" }}>{data.stats.totalProducts}</div>
               </div>
               <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
                 <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", fontWeight: "700", textTransform: "uppercase" }}>Tasdiqlangan Tushum</div>
                 <div style={{ fontSize: "2rem", fontWeight: "900", color: "var(--green)", marginTop: "0.5rem" }}>{formatPrice(data.stats.totalRevenue)}</div>
               </div>
               <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
                 <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", fontWeight: "700", textTransform: "uppercase" }}>Platforma komissiyasi (5%)</div>
                 <div style={{ fontSize: "2rem", fontWeight: "900", color: "var(--purple)", marginTop: "0.5rem" }}>{formatPrice(data.stats.totalPlatformFee ?? 0)}</div>
                 <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: "0.35rem" }}>Yetkazilgan buyurtmalar bo&apos;yicha jami</div>
               </div>
             </div>

             <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                <div
                  style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "1.5rem", boxShadow: "var(--shadow-sm)", cursor: "pointer" }}
                  onClick={() => setTab("payments")}
                >
                   <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "var(--orange-pale)", color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Clock size={24} />
                   </div>
                   <div>
                      <div style={{ color: "var(--gray-500)", fontSize: "0.85rem", fontWeight: "600" }}>Kutilayotgan Buyurtmalar</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>{data.stats.pendingOrders}</div>
                   </div>
                </div>
                <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "1.5rem", boxShadow: "var(--shadow-sm)" }}>
                   <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "var(--red-pale)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AlertTriangle size={24} />
                   </div>
                   <div>
                      <div style={{ color: "var(--gray-500)", fontSize: "0.85rem", fontWeight: "600" }}>Tasdiqlanmagan Do'konlar</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>{data.stats.unverifiedShops}</div>
                   </div>
                </div>
            <div
              style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "1.5rem", boxShadow: "var(--shadow-sm)", cursor: "pointer" }}
              onClick={() => setTab("moliya")}
            >
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "#FFF7ED", color: "#C2410C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                 <CreditCard size={24} />
              </div>
              <div>
                 <div style={{ color: "var(--gray-500)", fontSize: "0.85rem", fontWeight: "600" }}>Tasdiqlanmagan P2P</div>
                 <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>{data.stats.pendingP2P || 0}</div>
              </div>
            </div>
            <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "1.5rem", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "#EFF6FF", color: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                 <DollarSign size={24} />
              </div>
              <div>
                 <div style={{ color: "var(--gray-500)", fontSize: "0.85rem", fontWeight: "600" }}>Kutilayotgan pul yechish</div>
                 <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>{data.stats.pendingWithdrawals || 0}</div>
              </div>
            </div>
             </div>
           </>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && data?.payments && (
          <div style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--gray-100)", color: "var(--gray-600)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                <tr>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Buyurtma ID</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>To'lov ID</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Summa</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Sanasi</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Holati / Izoh</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800", textAlign: "right" }}>Harakat</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: "700", color: "var(--dark)" }}>
                       #{p.order_id.substring(0,8).toUpperCase()}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: "700", color: "var(--dark)" }}>
                       #{String(p.id || p.order_id).substring(0,8).toUpperCase()}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>{formatPrice(p.amount)}</td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "0.85rem", color: "var(--gray-500)" }}>{new Date(p.created_at).toLocaleString()}</td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span className={`badge badge-${p.status === "success" ? "green" : "gray"}`}>
                        {p.status === "success" ? "To'langan" : "Kutilmoqda"}
                      </span>
                      {p.provider_response === "claimed_p2p_payment_done" && (
                         <div style={{ fontSize: "0.75rem", color: "var(--orange)", marginTop: "0.5rem", fontWeight: "700" }}>
                            Xaridor "To'ladim" deb tasdiqladi!
                            {p.proof_image && (
                               <div style={{ marginTop: "0.6rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                  <a
                                    href={p.proof_image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Chek rasmini kattalashtirib ko'rish"
                                    style={{ display: "inline-flex", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--gray-200)" }}
                                  >
                                    <img
                                      src={p.proof_image}
                                      alt="To'lov cheki"
                                      style={{ width: 72, height: 72, objectFit: "cover", display: "block", background: "var(--gray-100)" }}
                                    />
                                  </a>
                                  <a href={p.proof_image} target="_blank" rel="noopener noreferrer" 
                                     style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--teal)", textDecoration: "underline", fontSize: "0.8rem" }}>
                                     <ImageIcon size={14} /> Chekni ko'rish
                                  </a>
                               </div>
                            )}
                         </div>
                      )}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                      {p.status === "pending" && (
                        <button onClick={() => action("payment", p.id, "approve")} className="btn btn-primary btn-sm" style={{ background: "var(--green)" }}>
                          <CheckCircle size={14} /> To'lovni tasdiqlash
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.payments.length === 0 && <div style={{ padding: "3rem", textAlign: "center", color: "var(--gray-500)" }}>To'lovlar yo'q</div>}
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && data?.orders && (
          <div style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--gray-100)", color: "var(--gray-600)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                <tr>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>ID</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Mijoz</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Lokatsiya</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Summa</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>To'lov</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Holati</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o: any) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "0.85rem", fontWeight: "700" }}>#{o.id.substring(0,8).toUpperCase()}</td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                       <div style={{ fontWeight: "700" }}>{o.recipient_name}</div>
                       <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>{o.recipient_phone}</div>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "0.85rem" }}>
                      {Number.isFinite(Number(o.delivery_lat)) && Number.isFinite(Number(o.delivery_lng)) ? (
                        <a
                          href={`https://www.google.com/maps?q=${o.delivery_lat},${o.delivery_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--teal)", textDecoration: "underline", fontWeight: 700 }}
                        >
                          Xaritada ochish
                        </a>
                      ) : (
                        <span style={{ color: "var(--gray-500)" }}>Yo'q</span>
                      )}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>{formatPrice(o.total_amount)}</td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span className={`badge badge-${o.payment_status === "paid" ? "green" : "red"}`}>
                        {PAYMENT_STATUS_UZ[o.payment_status as keyof typeof PAYMENT_STATUS_UZ] || o.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span className="badge" style={{ 
                        background: (ORDER_STATUS_BG[o.status as keyof typeof ORDER_STATUS_BG] as any)?.bg || "var(--gray-100)", 
                        color: (ORDER_STATUS_BG[o.status as keyof typeof ORDER_STATUS_BG] as any)?.color || "var(--gray-700)" 
                      }}>
                        {ORDER_STATUS_UZ[o.status as keyof typeof ORDER_STATUS_UZ] || o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.orders.length === 0 && <div style={{ padding: "3rem", textAlign: "center", color: "var(--gray-500)" }}>Buyurtmalar yo'q</div>}
          </div>
        )}

        {/* SHOPS */}
        {tab === "shops" && data?.shops && (
          <div style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--gray-100)", color: "var(--gray-600)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                <tr>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Do'kon nomi</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Shahar</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Holati</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800", textAlign: "right" }}>Harakat</th>
                </tr>
              </thead>
              <tbody>
                {data.shops.map((s: any) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: "700", color: "var(--dark)" }}>{s.name}</td>
                    <td style={{ padding: "1rem 1.5rem" }}>{s.city_name || "-"}</td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                       <span className={`badge badge-${s.is_verified ? "green" : "red"}`}>
                        {s.is_verified ? "Tasdiqlangan" : "Kutilmoqda"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                      {!s.is_verified ? (
                         <button onClick={() => action("shop", s.id, "approve")} className="btn btn-outline btn-sm" style={{ color: "var(--green)", borderColor: "var(--green)" }}><ShieldCheck size={14} /> Tasdiqlash</button>
                      ) : (
                         <button onClick={() => action("shop", s.id, "suspend")} className="btn btn-outline btn-sm" style={{ color: "var(--red)", borderColor: "var(--red-pale)" }}><Ban size={14} /> Bloklash</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* USERS */}
        {tab === "users" && data?.users && (
          <div style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--gray-100)", color: "var(--gray-600)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                <tr>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Ism / Email</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Rol</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800", textAlign: "right" }}>Harakat</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u: any) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "1rem 1.5rem" }}>
                       <div style={{ fontWeight: "700" }}>{u.name}</div>
                       <div style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                       <span className="badge badge-gray">{u.role}</span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                       {u.role !== "admin" && (
                         <button onClick={() => action("user", u.id, "delete")} className="btn btn-ghost" style={{ color: "var(--red)" }}>
                           <Trash2 size={16} />
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CHATS */}
        {tab === "chats" && data?.supportChats && (
          <div style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
             <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ background: "var(--gray-100)", color: "var(--gray-600)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                  <tr>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Mijoz</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Oxirgi xabar</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Sana</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800", textAlign: "right" }}>Harakat</th>
                  </tr>
                </thead>
                <tbody>
                  {data.supportChats.map((c: any) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                      <td style={{ padding: "1rem 1.5rem" }}>
                         <div style={{ fontWeight: "700" }}>{c.customer_name}</div>
                         <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{c.customer_email}</div>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.9rem", color: "var(--gray-600)" }}>
                         {c.last_message || "(Xabar yo'q)"}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.8rem", color: "var(--gray-500)" }}>
                         {new Date(c.updated_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                         <Link href={`/dashboard/chat?chatId=${c.id}`} className="btn btn-teal btn-sm">
                            <MessageCircle size={14} /> Javob berish
                         </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
             {data.supportChats.length === 0 && (
               <div style={{ padding: "4rem", textAlign: "center", color: "var(--gray-500)" }}>
                  <MessageCircle size={48} style={{ opacity: 0.2, marginBottom: "1rem" }} />
                  <div>Hozircha suhbatlar yo'q</div>
               </div>
             )}
          </div>
        )}

        {/* MOLIYA (WITHDRAWALS) */}
        {tab === "moliya" && (
          <div>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
              {[
                { label: "Kutilayotgan so'rovlar", value: (data?.withdrawals || []).filter((w: any) => w.status === "pending").length, color: "var(--orange)", bg: "var(--orange-pale)" },
                { label: "Bajarilgan to'lovlar", value: (data?.withdrawals || []).filter((w: any) => w.status === "completed").length, color: "var(--green)", bg: "#F0FDF4" },
                { label: "Jami so'rov summasi", value: formatPrice((data?.withdrawals || []).filter((w: any) => w.status === "pending").reduce((sum: number, w: any) => sum + w.amount, 0)), color: "var(--teal)", bg: "var(--teal-pale)" },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--card-bg)", borderRadius: "16px", padding: "1.5rem", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><DollarSign size={20} color={s.color} /></div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", fontWeight: "700" }}>{s.label}</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: "900", color: s.color }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ background: "var(--gray-100)", color: "var(--gray-600)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                  <tr>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Do'kon</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Karta</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Summa</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Sana</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Holat</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800", textAlign: "right" }}>Harakat</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.withdrawals || []).map((w: any) => (
                    <tr key={w.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: "700" }}>{w.shop_name}</td>
                      <td style={{ padding: "1rem 1.5rem", fontFamily: "monospace", fontWeight: "600" }}>**** {w.bank_card?.slice(-4)}</td>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: "800", color: "var(--teal)" }}>{formatPrice(w.amount)}</td>
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.85rem", color: "var(--gray-500)" }}>{new Date(w.created_at).toLocaleString()}</td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span style={{
                          padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "800",
                          background: w.status === "completed" ? "#F0FDF4" : w.status === "pending" ? "#FFFBEB" : "#FEF2F2",
                          color: w.status === "completed" ? "#166534" : w.status === "pending" ? "#92400E" : "#B91C1C"
                        }}>
                          {w.status === "completed" ? "Bajarildi" : w.status === "pending" ? "Kutilmoqda" : "Rad etildi"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                        {w.status === "pending" && (
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button onClick={() => action("withdrawal", w.id, "approve")}
                              className="btn btn-sm" style={{ background: "var(--green)", color: "white", border: "none" }}>
                              <CheckCircle size={14} /> Tasdiqlash
                            </button>
                            <button onClick={() => action("withdrawal", w.id, "reject")}
                              className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }}>
                              <XCircle size={14} /> Rad etish
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!data?.withdrawals || data.withdrawals.length === 0) && (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--gray-500)" }}>
                  <DollarSign size={40} style={{ opacity: 0.2, marginBottom: "1rem", display: "block", margin: "0 auto 1rem" }} />
                  Hozircha pul yechish so'rovlari yo'q
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "broadcast" && (
          <div className="admin-broadcast-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ background: "var(--card-bg)", borderRadius: "16px", boxShadow: "var(--shadow-sm)", padding: "1.25rem" }}>
              <h3 style={{ fontWeight: 900, marginBottom: "1rem" }}>Yangi ommaviy xabar</h3>
              <form onSubmit={createBroadcast} style={{ display: "grid", gap: "0.75rem" }}>
                <input
                  className="form-input"
                  placeholder="Sarlavha"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
                <textarea
                  className="form-input"
                  placeholder="Xabar matni"
                  style={{ minHeight: 120 }}
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm((p) => ({ ...p, message: e.target.value }))}
                  required
                />
                <select
                  className="form-input"
                  value={broadcastForm.targetRole}
                  onChange={(e) => setBroadcastForm((p) => ({ ...p, targetRole: e.target.value }))}
                >
                  <option value="all">Barchaga</option>
                  <option value="customer">Faqat mijozlarga</option>
                  <option value="provider">Faqat do'kon egalariga</option>
                </select>
                <button className="btn btn-primary" type="submit">Yuborish</button>
              </form>
            </div>

            <div style={{ background: "var(--card-bg)", borderRadius: "16px", boxShadow: "var(--shadow-sm)", padding: "1.25rem" }}>
              <h3 style={{ fontWeight: 900, marginBottom: "1rem" }}>So'nggi xabarlar</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {announcements.map((a) => (
                  <div key={a.id} style={{ border: "1px solid var(--gray-100)", borderRadius: 12, padding: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <strong>{a.title}</strong>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => toggleBroadcast(a.id, !!a.is_active)}
                      >
                        {a.is_active ? "O'chirish" : "Faollashtirish"}
                      </button>
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--gray-600)" }}>{a.message}</div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div style={{ color: "var(--gray-500)" }}>Hozircha xabarlar yo'q</div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "ai_queries" && (
          <div style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--gray-100)", color: "var(--gray-600)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                <tr>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>ID</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>So'rov matni</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Sana</th>
                </tr>
              </thead>
              <tbody>
                {aiQueries.map((q: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "1rem 1.5rem" }}>{i + 1}</td>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: "600" }}>{q.query}</td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "0.85rem", color: "var(--gray-500)" }}>{new Date(q.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {aiQueries.length === 0 && (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--gray-500)" }}>Hozircha so'rovlar yo'q</div>
            )}
          </div>
        )}

        {tab === "audit" && (
          <div style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div className="admin-audit-filters" style={{ padding: "1rem", borderBottom: "1px solid var(--gray-100)", display: "grid", gridTemplateColumns: "2fr repeat(4, minmax(0, 1fr))", gap: "0.75rem" }}>
              <input
                className="form-input"
                placeholder="Qidiruv: amal, admin, izoh, target..."
                value={auditFilters.search}
                onChange={(e) => setAuditFilters((p) => ({ ...p, search: e.target.value }))}
              />
              <select
                className="form-input"
                value={auditFilters.actionType}
                onChange={(e) => setAuditFilters((p) => ({ ...p, actionType: e.target.value }))}
              >
                <option value="all">Barcha amallar</option>
                {auditActionTypes.map((actionType) => (
                  <option key={actionType} value={actionType}>
                    {actionType}
                  </option>
                ))}
              </select>
              <select
                className="form-input"
                value={auditFilters.adminId}
                onChange={(e) => setAuditFilters((p) => ({ ...p, adminId: e.target.value }))}
              >
                <option value="all">Barcha adminlar</option>
                {auditAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.label}
                  </option>
                ))}
              </select>
              <input
                className="form-input"
                type="date"
                value={auditFilters.fromDate}
                onChange={(e) => setAuditFilters((p) => ({ ...p, fromDate: e.target.value }))}
              />
              <input
                className="form-input"
                type="date"
                value={auditFilters.toDate}
                onChange={(e) => setAuditFilters((p) => ({ ...p, toDate: e.target.value }))}
              />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--gray-100)", color: "var(--gray-600)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                <tr>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Vaqt</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Admin</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Amal</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Nishon</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: "800" }}>Izoh</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.map((log: any) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "0.85rem", color: "var(--gray-500)" }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: "700" }}>
                      {log.admin_name || log.admin_email || "-"}
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span className="badge badge-gray">{log.action_type}</span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <code>{log.target_type}:{String(log.target_id || "-").slice(0, 12)}</code>
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>{log.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAuditLogs.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--gray-500)" }}>
                Hozircha audit log yo'q
              </div>
            )}
          </div>
        )}

      </div>
      <style>{`
        @media (max-width: 980px) {
          .admin-quick-actions {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .admin-broadcast-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-audit-filters {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .admin-quick-actions {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
