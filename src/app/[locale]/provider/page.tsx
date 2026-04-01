"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Package, TrendingUp, Star, Gift, CheckCircle, Store, BarChart3, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalLoader } from "@/components/Loader";
import { CreditCard, Wallet, ArrowUpRight, History, X, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function ProviderDashboard() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerTab, setProviderTab] = useState<"analytics" | "orders">("analytics");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", bankCard: "", bankName: "" });
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    Promise.all([
      fetch("/api/provider/dashboard").then(r => r.json()),
      fetch("/api/provider/wallet").then(r => r.json()),
      fetch("/api/provider/orders").then(r => r.json()),
    ]).then(([d, w, o]) => {
      setData(d);
      setWallet(w);
      setOrders(o.orders || []);
      setLoading(false);
    });
  }, [session]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawForm.amount || !withdrawForm.bankCard) return;
    if (Number(withdrawForm.amount) > (wallet?.balance || 0)) {
      toast("Mablag' yetarli emas", "error");
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch("/api/provider/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withdrawForm),
      });
      if (res.ok) {
        toast("So'rov yuborildi!", "success");
        setShowWithdraw(false);
        setWithdrawForm({ amount: "", bankCard: "", bankName: "" });
        // Refresh wallet
        const w = await fetch("/api/provider/wallet").then(r => r.json());
        setWallet(w);
      } else {
        toast("Xatolik yuz berdi", "error");
      }
    } catch (e) {
      toast("Xatolik yuz berdi", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId);
    try {
      await fetch("/api/provider/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      // Refresh orders
      const o = await fetch("/api/provider/orders").then(r => r.json());
      setOrders(o.orders || []);
      // Refresh wallet if delivered
      if (status === "delivered") {
        const w = await fetch("/api/provider/wallet").then(r => r.json());
        setWallet(w);
      }
      toast("Buyurtma holati yangilandi!", "success");
    } catch (e) {
      toast("Xatolik yuz berdi", "error");
    } finally {
      setUpdatingOrder(null);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <GlobalLoader />
    </div>
  );

  if (data?.error === "Do'kon topilmadi") return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="empty-state" 
      style={{ padding: "4rem 2rem", background: "white", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-xs)", textAlign: "center" }}
    >
      <div style={{ width: "80px", height: "80px", background: "var(--teal-pale)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
        <Store size={40} color="var(--teal)" />
      </div>
      <h3 style={{ fontSize: "1.5rem", fontWeight: "900", marginBottom: "0.5rem" }}>Do'koningiz yo'q</h3>
      <p style={{ color: "var(--gray-500)", marginBottom: "2rem", maxWidth: "400px", margin: "0 auto 2rem" }}>Statistika uskunalaridan foydalanish uchun o'z do'koningizni yaratishingiz kerak.</p>
      <Link href="/provider/dokon" className="btn btn-primary btn-lg" style={{ fontWeight: "700" }}>Do'kon yaratish</Link>
    </motion.div>
  );

  const stats = data?.stats || {};
  const chartData = data?.chartData || [];
  const topProducts = data?.topProducts || [];
  const funnel = (data?.funnel || {}) as Record<string, number>;
  const lowStockProducts = data?.lowStockProducts || [];

  return (
    <div>
      {/* Tab Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontWeight: "800", marginBottom: "0.25rem" }}>
            {providerTab === "analytics" ? "Analitika" : "Buyurtmalar"}
          </h1>
          <p style={{ color: "var(--gray-500)" }}>
            {providerTab === "analytics" ? "Do'koningizning so'nggi 7 kunlik ko'rsatkichlari" : "Barcha buyurtmalaringizni boshqaring"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setProviderTab("analytics")}
            className="btn btn-sm"
            style={{ background: providerTab === "analytics" ? "var(--teal)" : "var(--gray-100)", color: providerTab === "analytics" ? "white" : "var(--gray-700)", border: "none" }}
          >
            <BarChart3 size={16} /> Analitika
          </button>
          <button
            onClick={() => setProviderTab("orders")}
            className="btn btn-sm"
            style={{ background: providerTab === "orders" ? "var(--teal)" : "var(--gray-100)", color: providerTab === "orders" ? "white" : "var(--gray-700)", border: "none", position: "relative" }}
          >
            <Package size={16} /> Buyurtmalar
            {orders.filter(o => o.status === "pending").length > 0 && (
              <span style={{ position: "absolute", top: "-6px", right: "-6px", width: "16px", height: "16px", background: "var(--red)", color: "white", fontSize: "10px", fontWeight: "900", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {orders.filter(o => o.status === "pending").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {providerTab === "analytics" && (
      <>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
        style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}
      >
        {[
          { icon: <TrendingUp size={24} />, value: formatPrice(stats.totalRevenue || 0), label: "Jami Daromad", bg: "#F0FDF4", color: "#166534", trend: "+12%" },
          { icon: <Package size={24} />, value: stats.ordersCount || 0, label: "Buyurtmalar", bg: "#EFF6FF", color: "#1E40AF", trend: "+5%" },
          { icon: <CheckCircle size={24} />, value: stats.deliveredCount || 0, label: "Yetkazilganlar", bg: "#F5F3FF", color: "#5B21B6", trend: "Barchasi" },
          { icon: <Star size={24} />, value: stats.pendingCount || 0, label: "Kutilayotgan", bg: "#FFFBEB", color: "#92400E", trend: "Bugun" },
          { icon: <Gift size={24} />, value: stats.activeCouponsCount || 0, label: "Faol kuponlar", bg: "#ECFDF3", color: "#065F46", trend: "Promo" }
        ].map((s, i) => (
          <motion.div 
            key={i} 
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1 }
            }}
            whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}
            style={{ background: "white", borderRadius: "24px", padding: "1.75rem", boxShadow: "var(--shadow-xs)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", border: "1px solid var(--gray-50)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.icon}
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: "800", background: s.bg, color: s.color, padding: "0.25rem 0.625rem", borderRadius: "100px" }}>{s.trend}</span>
            </div>
            <div style={{ fontWeight: "700", color: "var(--gray-400)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{s.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: "900", color: "var(--dark)", letterSpacing: "-0.03em" }}>{s.value}</div>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          style={{ background: "white", borderRadius: "var(--r-lg)", padding: "1.5rem", boxShadow: "var(--shadow-xs)" }}
        >
          <h3 style={{ fontWeight: "900", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={20} color="var(--teal)" /> Sotuv grafigi
          </h3>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDaromad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--teal)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--gray-400)" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--gray-400)" }} dx={-10} tickFormatter={val => val / 1000 + "k"} />
                <CartesianGrid vertical={false} stroke="var(--gray-100)" strokeDasharray="3 3" />
                <Tooltip 
                  formatter={(value: any) => formatPrice(value)}
                  contentStyle={{ borderRadius: "var(--r)", border: "none", boxShadow: "var(--shadow-md)", fontFamily: "Outfit, sans-serif" }}
                />
                <Area type="monotone" dataKey="daromad" stroke="var(--teal)" strokeWidth={3} fillOpacity={1} fill="url(#colorDaromad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          style={{ background: "white", borderRadius: "var(--r-lg)", padding: "1.5rem", boxShadow: "var(--shadow-xs)" }}
        >
          <h3 style={{ fontWeight: "900", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Gift size={20} color="var(--gold-dark)" /> Eng ko'p sotilganlar
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {topProducts.length > 0 ? topProducts.map((p: any, i: number) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: i < topProducts.length - 1 ? "1px solid var(--gray-50)" : "none" }}
              >
                <div>
                  <div style={{ fontWeight: "800", marginBottom: "0.25rem", fontSize: "0.95rem" }}>{p.title}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--gray-400)", fontWeight: "600" }}>{p.qty} ta sotilgan</div>
                </div>
                <div style={{ fontWeight: "900", color: "var(--teal)", fontSize: "1rem" }}>
                  {formatPrice(p.revenue)}
                </div>
              </motion.div>
            )) : (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--gray-400)", fontSize: "0.9rem" }}>
                Ma'lumot topilmadi
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
        <div style={{ background: "white", borderRadius: "var(--r-lg)", padding: "1.5rem", boxShadow: "var(--shadow-xs)" }}>
          <h3 style={{ fontWeight: "900", marginBottom: "1rem" }}>Buyurtma funnel</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {([
              ["pending", "Yangi"],
              ["accepted", "Qabul qilingan"],
              ["preparing", "Tayyorlanmoqda"],
              ["out_for_delivery", "Yo'lda"],
              ["delivered", "Yetkazilgan"],
              ["cancelled", "Bekor"],
            ] as Array<[string, string]>).map(([key, label]) => (
              <div key={String(key)} style={{ border: "1px solid var(--gray-100)", borderRadius: 12, padding: "0.75rem" }}>
                <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 900, fontSize: 22 }}>{funnel[key] || 0}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "var(--r-lg)", padding: "1.5rem", boxShadow: "var(--shadow-xs)" }}>
          <h3 style={{ fontWeight: "900", marginBottom: "1rem" }}>Kam qolgan mahsulotlar</h3>
          {lowStockProducts.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {lowStockProducts.map((p: any) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--gray-100)", paddingBottom: "0.5rem" }}>
                  <div style={{ fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontWeight: 800, color: "var(--orange)" }}>{p.stock_qty} dona</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--gray-500)" }}>Hozircha low-stock mahsulot yo'q</div>
          )}
        </div>
      </div>

      </>
      )}

      {/* ORDERS TAB */}
      {providerTab === "orders" && (
        <div style={{ background: "white", borderRadius: "24px", overflow: "hidden", boxShadow: "var(--shadow-xs)", border: "1px solid var(--gray-50)" }}>
          {orders.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--gray-400)" }}>
              <Package size={48} style={{ opacity: 0.2, display: "block", margin: "0 auto 1rem" }} />
              <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>Hozircha buyurtmalar yo'q</div>
              <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>Yangi buyurtmalar bu yerda ko'rinadi</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "var(--gray-50)", color: "var(--gray-500)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800", textAlign: "left" }}>Buyurtma</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800", textAlign: "left" }}>Mijoz</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800", textAlign: "left" }}>Mahsulotlar</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800", textAlign: "left" }}>Summa</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800", textAlign: "left" }}>Holat</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: "800", textAlign: "right" }}>Harakat</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: any) => {
                    const statusNext: Record<string, string> = {
                      pending: "preparing", preparing: "shipped", shipped: "delivered"
                    };
                    const statusLabel: Record<string, string> = {
                      pending: "Yangi", preparing: "Tayyorlanmoqda", shipped: "Yo'lda", delivered: "Yetkazildi", cancelled: "Bekor"
                    };
                    const statusColor: Record<string, string> = {
                      pending: "#FFFBEB", preparing: "#EFF6FF", shipped: "#F5F3FF", delivered: "#F0FDF4", cancelled: "#FEF2F2"
                    };
                    const statusTextColor: Record<string, string> = {
                      pending: "#92400E", preparing: "#1E40AF", shipped: "#5B21B6", delivered: "#166534", cancelled: "#B91C1C"
                    };
                    const nextStatus = statusNext[o.status];

                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid var(--gray-50)" }}>
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <div style={{ fontWeight: "800", fontFamily: "monospace", fontSize: "0.85rem" }}>#{o.id.substring(0, 8).toUpperCase()}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: "0.25rem" }}>{new Date(o.created_at).toLocaleDateString()}</div>
                        </td>
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <div style={{ fontWeight: "700" }}>{o.recipient_name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{o.recipient_phone}</div>
                        </td>
                        <td style={{ padding: "1rem 1.5rem", maxWidth: "200px" }}>
                          <div style={{ fontSize: "0.85rem", color: "var(--gray-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {o.items_title || "-"}
                          </div>
                        </td>
                        <td style={{ padding: "1rem 1.5rem", fontWeight: "800", color: "var(--teal)" }}>
                          {formatPrice(o.total_amount)}
                        </td>
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <span style={{
                            padding: "0.3rem 0.8rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "800",
                            background: statusColor[o.status] || "var(--gray-100)",
                            color: statusTextColor[o.status] || "var(--gray-700)"
                          }}>
                            {statusLabel[o.status] || o.status}
                          </span>
                        </td>
                        <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                          {nextStatus && (
                            <button
                              onClick={() => updateOrderStatus(o.id, nextStatus)}
                              disabled={updatingOrder === o.id}
                              className="btn btn-primary btn-sm"
                              style={{ borderRadius: "10px", fontSize: "0.8rem" }}
                            >
                              {updatingOrder === o.id ? "..." : <><ArrowRight size={14} /> {nextStatus === "preparing" ? "Tayyorlashni boshlash" : nextStatus === "shipped" ? "Jo'natildi" : "Yetkazildi"}</>}
                            </button>
                          )}
                          {o.status === "cancelled" && <span style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>Bekor qilingan</span>}
                          {o.status === "delivered" && <span style={{ color: "var(--green)", fontSize: "0.85rem", fontWeight: "700" }}>✓ Tugallandi</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* WALLET SECTION */}
      <div style={{ marginTop: "2.5rem" }}>
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontWeight: "900", display: "flex", alignItems: "center", gap: "0.5rem" }}>
               <Wallet size={24} color="var(--teal)" /> Hamyon va To'lovlar
            </h3>
            <button onClick={() => setShowWithdraw(true)} className="btn btn-primary" style={{ borderRadius: "12px" }}>
               <ArrowUpRight size={18} /> Pullarni yechish
            </button>
         </div>

         <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem" }}>
            {/* Balance Card */}
            <motion.div 
               whileHover={{ scale: 1.02 }}
               style={{ background: "linear-gradient(135deg, var(--teal-dark), var(--teal))", borderRadius: "24px", padding: "2rem", color: "white", boxShadow: "0 20px 40px rgba(20,184,166,0.2)" }}
            >
               <div style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "0.5rem", fontWeight: "600" }}>Mavjud balans</div>
               <div style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "1.5rem" }}>{formatPrice(wallet?.balance || 0)}</div>
               
               <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "16px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                     <div style={{ fontSize: "0.75rem", opacity: 0.7, fontWeight: "600" }}>Kutilayotgan</div>
                     <div style={{ fontWeight: "800" }}>{formatPrice(wallet?.pendingBalance || 0)}</div>
                  </div>
                  <Clock size={20} style={{ opacity: 0.5 }} />
               </div>
            </motion.div>

            {/* Withdrawal History */}
            <div style={{ background: "white", borderRadius: "24px", padding: "1.5rem", boxShadow: "var(--shadow-xs)", border: "1px solid var(--gray-50)" }}>
               <div style={{ fontWeight: "800", marginBottom: "1rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <History size={18} color="var(--gray-400)" /> Oxirgi o'tkazmalar
               </div>
               <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                     <thead>
                        <tr style={{ color: "var(--gray-400)", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase" }}>
                           <th style={{ padding: "0.75rem 0", fontWeight: "800" }}>Sana</th>
                           <th style={{ padding: "0.75rem 0", fontWeight: "800" }}>Karta</th>
                           <th style={{ padding: "0.75rem 0", fontWeight: "800" }}>Summa</th>
                           <th style={{ padding: "0.75rem 0", fontWeight: "800", textAlign: "right" }}>Holat</th>
                        </tr>
                     </thead>
                     <tbody>
                        {wallet?.withdrawals?.length > 0 ? wallet.withdrawals.map((w: any) => (
                           <tr key={w.id} style={{ borderTop: "1px solid var(--gray-50)" }}>
                              <td style={{ padding: "1rem 0", color: "var(--gray-500)" }}>{new Date(w.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: "1rem 0", fontWeight: "600" }}>**** {w.bank_card.slice(-4)}</td>
                              <td style={{ padding: "1rem 0", fontWeight: "700" }}>{formatPrice(w.amount)}</td>
                              <td style={{ padding: "1rem 0", textAlign: "right" }}>
                                 <span style={{ 
                                    padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.7rem", fontWeight: "800",
                                    background: w.status === "completed" ? "#F0FDF4" : w.status === "pending" ? "#FFFBEB" : "#FEF2F2",
                                    color: w.status === "completed" ? "#166534" : w.status === "pending" ? "#92400E" : "#B91C1C"
                                 }}>
                                    {w.status === "completed" ? "Bajarildi" : w.status === "pending" ? "Kutilmoqda" : "Rad etilgan"}
                                 </span>
                              </td>
                           </tr>
                        )) : (
                           <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--gray-400)" }}>Hozircha o'tkazmalar yo'q</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>

      {/* WITHDRAW MODAL */}
      <AnimatePresence>
         {showWithdraw && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1.5rem" }}>
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  style={{ background: "white", borderRadius: "32px", padding: "2.5rem", width: "100%", maxWidth: "450px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
               >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                     <h3 style={{ fontSize: "1.5rem", fontWeight: "900" }}>Mablag'ni yechish</h3>
                     <button onClick={() => setShowWithdraw(false)} style={{ background: "none", border: "none", color: "var(--gray-400)", cursor: "pointer" }}><X size={24} /></button>
                  </div>
                  
                  <form onSubmit={handleWithdraw} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                     <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.5rem", color: "var(--gray-500)" }}>Summa (UZS)</label>
                        <input 
                           type="number" required placeholder="Masalan: 100000"
                           value={withdrawForm.amount}
                           onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                           style={{ width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid var(--gray-200)", fontSize: "1.1rem", fontWeight: "700" }} 
                        />
                        <div style={{ fontSize: "0.8rem", color: "var(--teal)", marginTop: "0.4rem", fontWeight: "600" }}>Mavjud: {formatPrice(wallet?.balance || 0)}</div>
                     </div>
                     <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.5rem", color: "var(--gray-500)" }}>Karta raqami (8600...)</label>
                        <input 
                           type="text" required placeholder="0000 0000 0000 0000"
                           value={withdrawForm.bankCard}
                           onChange={(e) => setWithdrawForm({...withdrawForm, bankCard: e.target.value})}
                           style={{ width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid var(--gray-200)", fontSize: "1.1rem", fontWeight: "700", letterSpacing: "1px" }} 
                        />
                     </div>
                     <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.5rem", color: "var(--gray-500)" }}>Bank nomi (Ixtiyoriy)</label>
                        <input 
                           type="text" placeholder="Masalan: TBC Bank"
                           value={withdrawForm.bankName}
                           onChange={(e) => setWithdrawForm({...withdrawForm, bankName: e.target.value})}
                           style={{ width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid var(--gray-200)", fontSize: "1rem" }} 
                        />
                     </div>

                     <button type="submit" disabled={withdrawing} className="btn btn-primary btn-lg" style={{ marginTop: "0.5rem", width: "100%", borderRadius: "16px" }}>
                        {withdrawing ? "Yuborilmoqda..." : "Yuborish"}
                     </button>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <style>{`
        @media(max-width:1024px){
          div[style*="gridTemplateColumns: 'repeat(5, 1fr)'"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="gridTemplateColumns: '2fr 1fr'"] { grid-template-columns: 1fr !important; }
          div[style*="gridTemplateColumns: '1fr 1fr'"] { grid-template-columns: 1fr !important; }
        }
        @media(max-width:640px){
          div[style*="gridTemplateColumns: 'repeat(5, 1fr)'"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
