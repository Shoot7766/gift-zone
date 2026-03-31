"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/navigation";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice, getOrderGrossTotal, computePlatformFee } from "@/lib/utils";
import { CheckCircle, CreditCard, Copy, AlertCircle, ArrowRight, ShieldCheck, Camera, X, Image as ImageIcon } from "lucide-react";
import { GlobalLoader } from "@/components/Loader";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const clearCart = useCartStore((s) => s.clearCart);

  const orderId = searchParams.get("orderId");
  const method = searchParams.get("method");
  const paymentIdParam = searchParams.get("paymentId");

  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const adminCard = process.env.NEXT_PUBLIC_ADMIN_CARD_NUMBER || "8600 1204 5678 9012";
  const adminName = process.env.NEXT_PUBLIC_ADMIN_CARD_NAME || "Gift Zone Admin";

  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(d => {
        if (d.order) setOrderInfo(d.order);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId, router]);

  const handleCopy = () => {
    navigator.clipboard.writeText(adminCard.replace(/\s/g, ''));
    setCopied(true);
    toast("Karta raqami nusxalandi", "success");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast("Rasm hajmi 5MB dan oshmasligi kerak", "error");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
      setIsUploading(false);
      toast("Rasm yuklandi", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!proofImage) {
      toast("Iltimos, to'lov chekini (screenshot) yuklang", "error");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          method: "p2p_transfer",
          proofImage,
          ...(paymentIdParam ? { paymentId: paymentIdParam } : {}),
        }),
      });
      if (res.ok) {
        clearCart();
        toast("To'lov tekshiruvga yuborildi!", "success");
        router.push(`/buyurtma/muvaffaqiyat?orderId=${orderId || ""}`);
      } else {
        toast("Xatolik yuz berdi", "error");
      }
    } catch (e) {
      toast("Xatolik yuz berdi", "error");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <GlobalLoader fullScreen />;
  if (!orderInfo) return <div style={{ textAlign: "center", padding: "4rem" }}>Buyurtma topilmadi.</div>;

  const payableTotal = getOrderGrossTotal(orderInfo);
  const platformDisplay =
    orderInfo.platform_fee != null && orderInfo.platform_fee > 0
      ? orderInfo.platform_fee
      : computePlatformFee(orderInfo.total_amount);

  return (
    <div style={{ background: "var(--gray-50)", minHeight: "100vh", padding: "4rem 1.5rem" }}>
      <main className="container" style={{ maxWidth: "600px", margin: "0 auto" }}>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: "white", borderRadius: "32px", padding: "3rem 2rem", boxShadow: "var(--shadow-sm)", textAlign: "center" }}
        >
           <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--teal-pale)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto" }}>
             <CreditCard size={40} />
           </div>
           
           <h1 style={{ fontSize: "1.75rem", fontWeight: "900", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>To'lovni amalga oshirish</h1>
           <p style={{ color: "var(--gray-500)", marginBottom: "2.5rem", lineHeight: "1.6" }}>
             Quyidagi karta raqamiga buyurtma summasini o'tkazing va tasdiqlash tugmasini bosing. Biz to'lovni tasdiqlaganimizdan so'ng darhol yetkazib berishni boshlaymiz.
           </p>

           <div style={{ background: "var(--gray-50)", border: "1px dashed var(--gray-300)", borderRadius: "24px", padding: "2rem", marginBottom: "2.5rem", position: "relative" }}>
             
             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "var(--gray-500)", fontSize: "0.9rem" }}>
               <span>Buyurtma raqami:</span>
               <span style={{ fontWeight: "700", color: "var(--dark)" }}>#{orderId?.substring(0,6).toUpperCase()}</span>
             </div>
             
             <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem", color: "var(--gray-500)", fontSize: "0.9rem", borderBottom: "1px solid var(--gray-200)", paddingBottom: "1.5rem" }}>
               <div style={{ display: "flex", justifyContent: "space-between" }}>
                 <span>Mahsulotlar</span>
                 <span style={{ fontWeight: "700", color: "var(--dark)" }}>{formatPrice(orderInfo.total_amount)}</span>
               </div>
               <div style={{ display: "flex", justifyContent: "space-between" }}>
                 <span>Yetkazib berish</span>
                 <span style={{ fontWeight: "700", color: "var(--dark)" }}>{formatPrice(orderInfo.delivery_fee || 0)}</span>
               </div>
               <div style={{ display: "flex", justifyContent: "space-between" }}>
                 <span>Platforma xizmati (5%)</span>
                 <span style={{ fontWeight: "700", color: "var(--dark)" }}>{formatPrice(platformDisplay)}</span>
               </div>
               <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.6rem", borderTop: "1px dashed var(--gray-200)" }}>
                 <span>To&apos;lov summasi (jami)</span>
                 <span style={{ fontWeight: "900", color: "var(--teal-dark)", fontSize: "1.35rem" }}>{formatPrice(payableTotal)}</span>
               </div>
             </div>

             <div style={{ textAlign: "left" }}>
               <label style={{ display: "block", fontSize: "0.85rem", color: "var(--gray-400)", marginBottom: "0.5rem", fontWeight: "600", textTransform: "uppercase" }}>Karta raqami</label>
               <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                 <div style={{ flex: 1, background: "white", border: "2px solid var(--teal-pale)", borderRadius: "16px", padding: "1rem 1.5rem", fontSize: "1.5rem", fontWeight: "900", color: "var(--dark)", letterSpacing: "2px" }}>
                   {adminCard}
                 </div>
                 <button 
                   onClick={handleCopy}
                   className="btn" 
                   style={{ width: "56px", height: "56px", background: copied ? "var(--green)" : "var(--teal-pale)", color: copied ? "white" : "var(--teal)", borderRadius: "16px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                 >
                   {copied ? <CheckCircle size={24} /> : <Copy size={24} />}
                 </button>
               </div>
               <div style={{ marginTop: "0.75rem", color: "var(--gray-500)", fontSize: "0.95rem", paddingLeft: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ShieldCheck size={16} color="var(--green)" /> Qabul qiluvchi: <strong style={{ color: "var(--dark)" }}>{adminName}</strong>
               </div>
             </div>

             {/* Proof Image Upload [NEW] */}
             <div style={{ marginTop: "2rem", borderTop: "1px solid var(--gray-200)", paddingTop: "1.5rem", textAlign: "left" }}>
               <label style={{ display: "block", fontSize: "0.85rem", color: "var(--gray-400)", marginBottom: "1rem", fontWeight: "600", textTransform: "uppercase" }}>To'lov cheki (Screenshot)</label>
               
               <AnimatePresence mode="wait">
                 {!proofImage ? (
                   <motion.div 
                     key="upload"
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                   >
                     <label style={{ 
                       display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
                       gap: "1rem", padding: "2rem", background: "white", borderRadius: "20px", 
                       border: "2px dashed var(--teal-pale)", cursor: "pointer", transition: "all 0.2s"
                     }} className="proof-upload-label">
                       <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--teal-pale)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                         {isUploading ? <GlobalLoader /> : <Camera size={24} />}
                       </div>
                       <div style={{ textAlign: "center" }}>
                         <div style={{ fontWeight: "700", color: "var(--dark)", marginBottom: "0.25rem" }}>Chekni yuklash</div>
                         <div style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>PNG, JPG (Maks. 5MB)</div>
                       </div>
                       <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                     </label>
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="preview"
                     initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                     style={{ position: "relative", borderRadius: "20px", overflow: "hidden", border: "2px solid var(--teal)" }}
                   >
                     <img src={proofImage} alt="Payment Proof" style={{ width: "100%", height: "auto", display: "block" }} />
                     <button 
                       onClick={() => setProofImage(null)}
                       style={{ position: "absolute", top: "1rem", right: "1rem", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}
                     >
                       <X size={18} />
                     </button>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
           </div>

           <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button 
                 onClick={handleVerify} 
                 disabled={verifying}
                 className="btn btn-primary btn-lg" 
                 style={{ width: "100%", fontSize: "1.1rem" }}
              >
                 {verifying ? "Tasdiqlanmoqda..." : "Men to'lovni amalga oshirdim"}
              </button>
              <button 
                 onClick={() => router.back()} 
                 className="btn btn-ghost"
              >
                 Orqaga qaytish
              </button>
           </div>
           
           <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", background: "#FEF2F2", color: "#B91C1C", padding: "1.25rem", borderRadius: "16px", marginTop: "2rem", textAlign: "left", fontSize: "0.85rem", lineHeight: "1.5" }}>
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
              <div>Iltimos, pulni ko'chirib bo'lganingizdan so'ng tasdiqlash tugmasini bosing! Yolg'on tasdiqlashlar natijasida profilingiz bloklanishi mumkin.</div>
           </div>

        </motion.div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return <Suspense fallback={<GlobalLoader fullScreen />}><PaymentContent /></Suspense>;
}
