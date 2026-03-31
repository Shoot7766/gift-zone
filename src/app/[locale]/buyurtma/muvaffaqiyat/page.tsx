"use client";
import { useEffect, useState, Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/navigation";
import { CheckCircle, Package, ArrowRight, Home } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { OrderStepper } from "@/components/orders/OrderStepper";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const t = useTranslations("checkout");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(d => {
        if (d.order) setOrder(d.order);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", background: "var(--gray-50)" }}>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ maxWidth: "560px", width: "100%", background: "white", borderRadius: "24px", padding: "3rem 2rem", boxShadow: "var(--shadow-lg)", textAlign: "center", position: "relative", zIndex: 10 }}
      >
        
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
          style={{ width: "80px", height: "80px", background: "var(--teal)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "0 8px 24px rgba(27,67,50,0.2)" }}
        >
          <CheckCircle size={40} color="white" />
        </motion.div>

        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.5rem", color: "var(--dark)" }}
        >
          {t("orderSuccess")}
        </motion.h1>
        <motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ color: "var(--gray-500)", fontSize: "1.1rem", marginBottom: "2.5rem", lineHeight: "1.6" }}
        >
          {t("orderSuccessDesc")}
        </motion.p>

        {loading ? (
           <div style={{ padding: "2rem", color: "var(--gray-400)" }}>{tCommon("loading")}</div>
        ) : order ? (
          <div style={{ background: "var(--gray-50)", borderRadius: "16px", padding: "1.5rem", textAlign: "left", marginBottom: "2.5rem", border: "1px solid var(--gray-100)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px dashed var(--gray-300)" }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>ID</div>
                <div style={{ fontWeight: "800", fontSize: "1.1rem", fontFamily: "monospace" }}>#{order.id?.slice(-8).toUpperCase()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>{t("total")}</div>
                <div style={{ fontWeight: "900", fontSize: "1.25rem", color: "var(--teal)" }}>
                  {formatPrice((order.total_amount || 0) + (order.delivery_fee || 0))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <span style={{ color: "var(--gray-500)", display: "block", marginBottom: "0.25rem" }}>{t("address")}:</span>
                <span style={{ fontWeight: "600", color: "var(--dark)" }}>{order.delivery_address}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "1.5rem", background: "var(--gray-50)", borderRadius: "16px", marginBottom: "2.5rem", color: "var(--gray-500)" }}>
             {t("noDetails")}
          </div>
        )}

        {/* Order Progress Stepper [NEW] */}
        {order && (
          <div style={{ marginBottom: "2.5rem", padding: "1.5rem", background: "var(--gray-50)", borderRadius: "20px" }}>
            <div style={{ marginBottom: "1rem", fontSize: "0.85rem", fontWeight: "700", color: "var(--gray-500)", textTransform: "uppercase", textAlign: "left" }}>
              Buyurtma holati
            </div>
            <OrderStepper status={order.status} />
          </div>
        )}

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ display: "flex", gap: "1rem", flexDirection: "column" }}
        >
          <button onClick={() => router.push("/katalog")} className="btn btn-primary btn-xl" style={{ width: "100%", justifyContent: "center", fontWeight: "800" }}>
            {tNav("catalog")} <ArrowRight size={18} />
          </button>
          <Link href="/" className="btn btn-ghost btn-lg" style={{ width: "100%", justifyContent: "center", border: "1px solid var(--gray-200)", fontWeight: "600" }}>
            <Home size={18} /> {tNav("home")}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
