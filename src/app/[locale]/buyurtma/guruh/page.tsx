"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Copy, CheckCircle, Share2, Users } from "lucide-react";
import { formatPrice, getOrderGrossTotal } from "@/lib/utils";
import { GlobalLoader } from "@/components/Loader";

export default function GroupGiftingPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(r => r.json())
        .then(d => {
          if (d.order) setOrder(d.order);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId || typeof window === "undefined") return;
    setShareUrl(`${window.location.origin}/${locale}/to'lov/${orderId}`);
  }, [orderId, locale]);

  if (loading) return <GlobalLoader fullScreen />;

  if (!order) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1rem" }}>Buyurtma topilmadi</h2>
          <a href="/" className="btn btn-primary">Bosh sahifaga qaytish</a>
        </div>
      </div>
    );
  }

  const totalAmount = getOrderGrossTotal(order);
  
  // Calculate how much has been paid so far (sum of successful payments)
  const paidAmount = order.payments?.filter((p: any) => p.status === "success").reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const progressPercent = Math.min(100, (paidAmount / totalAmount) * 100);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Sovg'a uchun birgalikda yig'amiz!",
          text: `Biz ${order.recipient_name} uchun ajoyib sovg'a tanladik. Keling, birgalikda yig'amiz!`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)", padding: "3rem 1.5rem" }}>
      <div className="container" style={{ maxWidth: "600px" }}>
        
        <div style={{ background: "white", borderRadius: "24px", padding: "2.5rem", boxShadow: "var(--shadow-md)", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--gold-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <Users size={40} color="var(--gold-dark)" />
          </div>
          
          <h1 style={{ fontWeight: "900", fontSize: "1.8rem", marginBottom: "0.5rem", color: "var(--dark)" }}>
            Birgalikda yig'ish boshlandi!
          </h1>
          <p style={{ color: "var(--gray-500)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Do'stlaringiz bilan birgalikda to'lov qilish uchun quyidagi havolani ulashing. Ular xohlagan summani kiritib to'lov qilishlari mumkin.
          </p>

          {/* Progress Bar */}
          <div style={{ background: "var(--gray-50)", borderRadius: "16px", padding: "1.5rem", marginBottom: "2rem", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontWeight: "700" }}>
              <span style={{ color: "var(--gray-600)" }}>Yig'ildi: <span style={{ color: "var(--teal)" }}>{formatPrice(paidAmount)}</span></span>
              <span style={{ color: "var(--gray-600)" }}>Jami: {formatPrice(totalAmount)}</span>
            </div>
            <div style={{ width: "100%", height: "12px", background: "var(--gray-200)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ width: `${progressPercent}%`, height: "100%", background: "var(--teal)", transition: "width 0.5s ease-out" }} />
            </div>
            {remainingAmount > 0 && (
              <div style={{ fontSize: "0.85rem", color: "var(--orange)", marginTop: "0.75rem", textAlign: "center", fontWeight: "600" }}>
                Yana {formatPrice(remainingAmount)} yig'ish kerak
              </div>
            )}
            {remainingAmount === 0 && (
              <div style={{ fontSize: "0.9rem", color: "var(--green)", marginTop: "0.75rem", textAlign: "center", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <CheckCircle size={16} /> Kerakli summa to'liq yig'ildi!
              </div>
            )}
          </div>

          {/* Share Link — to'liq URL (til prefiksi bilan), do'stlarga Telegram/WhatsApp orqali yuboriladi */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--gray-500)", textTransform: "uppercase", marginBottom: "0.5rem", textAlign: "left" }}>
              Do&apos;stlaringizga yuboradigan havola
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--gray-600)", textAlign: "left", marginBottom: "0.75rem", lineHeight: 1.5 }}>
              Quyidagi havolani nusxalab Telegram, WhatsApp yoki boshqa joyga yuboring. Do&apos;stlaringiz shu sahifadan o&apos;z hissalarini qo&apos;shishi mumkin (avtomatik SMS yuborilmaydi).
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                readOnly 
                value={shareUrl || "Havola tayyorlanmoqda…"} 
                className="form-input" 
                style={{ flex: 1, background: "var(--gray-50)", color: "var(--gray-600)", fontSize: "0.9rem" }} 
              />
              <button
                type="button"
                onClick={handleCopy}
                disabled={!shareUrl}
                className="btn btn-outline"
                style={{ padding: "0 1rem" }}
                title="Havolani nusxalash"
              >
                {copied ? <CheckCircle size={20} color="var(--green)" /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
            <button
              type="button"
              onClick={handleShare}
              disabled={!shareUrl}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", display: "flex", justifyContent: "center", gap: "0.5rem" }}
            >
              <Share2 size={20} /> Do&apos;stlarga yuborish
            </button>
            <a href="/dashboard/buyurtmalar" className="btn btn-ghost" style={{ width: "100%" }}>
              Mening buyurtmalarim
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
