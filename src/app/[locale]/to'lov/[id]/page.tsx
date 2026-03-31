"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { formatPrice, getOrderGrossTotal } from "@/lib/utils";
import { GlobalLoader } from "@/components/Loader";
import { CreditCard, Users, CheckCircle } from "lucide-react";

export default function PublicPaymentPage() {
  const locale = useLocale();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState("p2p_transfer");
  const [processing, setProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => setWalletBalance(Number(d.balance || 0)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(r => r.json())
        .then(d => {
          if (d.order) {
            setOrder(d.order);
            // Calculate remaining amount
            const total = getOrderGrossTotal(d.order);
            const paid = d.order.payments?.filter((p: any) => p.status === "success").reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
            const remaining = Math.max(0, total - paid);
            setAmount(remaining.toString());
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [orderId]);

  if (loading) return <GlobalLoader fullScreen />;

  if (!order) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "800" }}>Buyurtma topilmadi</h2>
      </div>
    );
  }

  const totalAmount = getOrderGrossTotal(order);
  const paidAmount = order.payments?.filter((p: any) => p.status === "success").reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const progressPercent = Math.min(100, (paidAmount / totalAmount) * 100);

  const handlePay = async () => {
    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      alert("Iltimos, to'g'ri summa kiriting");
      return;
    }
    if (payAmount > remainingAmount) {
      alert(`Maksimal to'lov summasi: ${formatPrice(remainingAmount)}`);
      return;
    }

    setProcessing(true);
    try {
      if (method === "wallet") {
        const res = await fetch("/api/wallet/group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            amount: payAmount,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Hamyondan to'lovda xatolik");
          return;
        }
        window.location.reload();
        return;
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            method,
            amount: payAmount,
            isGroupGifting: true,
          }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else if (method === "p2p_transfer") {
          window.location.href = `/${locale}/buyurtma/tulov?orderId=${order.id}&method=p2p_transfer&paymentId=${data.paymentId}`;
        }
      } else {
        alert(data.error || "To'lovda xatolik");
      }
    } catch (e) {
      alert("Xatolik yuz berdi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)", padding: "3rem 1.5rem" }}>
      <div className="container" style={{ maxWidth: "500px" }}>
        
        <div style={{ background: "white", borderRadius: "24px", padding: "2.5rem", boxShadow: "var(--shadow-md)" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--teal-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Users size={32} color="var(--teal)" />
            </div>
            <h1 style={{ fontWeight: "900", fontSize: "1.5rem", color: "var(--dark)", marginBottom: "0.5rem" }}>
              {order.recipient_name} uchun sovg'a
            </h1>
            <p style={{ color: "var(--gray-500)", fontSize: "0.95rem" }}>
              Do'stlaringiz bilan birgalikda yig'ilyapti
            </p>
          </div>

          {/* Progress */}
          <div style={{ background: "var(--gray-50)", borderRadius: "16px", padding: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontWeight: "700", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--gray-600)" }}>Yig'ildi: <span style={{ color: "var(--teal)" }}>{formatPrice(paidAmount)}</span></span>
              <span style={{ color: "var(--gray-600)" }}>Jami: {formatPrice(totalAmount)}</span>
            </div>
            <div style={{ width: "100%", height: "10px", background: "var(--gray-200)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ width: `${progressPercent}%`, height: "100%", background: "var(--teal)", transition: "width 0.5s ease-out" }} />
            </div>
          </div>

          {remainingAmount === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <CheckCircle size={64} color="var(--green)" style={{ margin: "0 auto 1rem" }} />
              <h2 style={{ fontWeight: "800", color: "var(--green)", marginBottom: "0.5rem" }}>Ajoyib!</h2>
              <p style={{ color: "var(--gray-600)" }}>Kerakli summa to'liq yig'ildi. Hissangiz uchun rahmat!</p>
            </div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">O'z hissangizni qo'shing (so'm)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ width: "100%", fontSize: "1.2rem", fontWeight: "800", padding: "1rem" }} 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  max={remainingAmount}
                />
                <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: "0.5rem" }}>
                  Qolgan summa: {formatPrice(remainingAmount)}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                <button 
                  onClick={() => setMethod("wallet")}
                  style={{ padding: "1rem", borderRadius: "12px", border: method === "wallet" ? "2px solid var(--teal)" : "2px solid var(--gray-100)", background: "white", fontWeight: "700", cursor: "pointer" }}
                >
                  Hamyon ({formatPrice(walletBalance)})
                </button>
                <button 
                  onClick={() => setMethod("click")}
                  style={{ padding: "1rem", borderRadius: "12px", border: method === "click" ? "2px solid var(--teal)" : "2px solid var(--gray-100)", background: "white", fontWeight: "700", cursor: "pointer" }}
                >
                  Click
                </button>
                <button 
                  onClick={() => setMethod("payme")}
                  style={{ padding: "1rem", borderRadius: "12px", border: method === "payme" ? "2px solid var(--teal)" : "2px solid var(--gray-100)", background: "white", fontWeight: "700", cursor: "pointer" }}
                >
                  Payme
                </button>
                <button 
                  onClick={() => setMethod("uzum")}
                  style={{ padding: "1rem", borderRadius: "12px", border: method === "uzum" ? "2px solid var(--teal)" : "2px solid var(--gray-100)", background: "white", fontWeight: "700", cursor: "pointer" }}
                >
                  Uzum
                </button>
                <button 
                  onClick={() => setMethod("p2p_transfer")}
                  style={{ padding: "1rem", borderRadius: "12px", border: method === "p2p_transfer" ? "2px solid var(--teal)" : "2px solid var(--gray-100)", background: "white", fontWeight: "700", cursor: "pointer" }}
                >
                  Karta (P2P)
                </button>
              </div>

              <button 
                onClick={handlePay} 
                disabled={processing || !amount || Number(amount) <= 0} 
                className="btn btn-primary btn-lg" 
                style={{ width: "100%", display: "flex", justifyContent: "center", gap: "0.5rem" }}
              >
                {processing ? "Kuting..." : "To'lov qilish"} <CreditCard size={20} />
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
