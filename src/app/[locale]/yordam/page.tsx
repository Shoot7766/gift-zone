"use client";
import { Link, useRouter } from "@/navigation";
import { HelpCircle, MessageCircle, Truck, CreditCard, RefreshCcw, ShieldCheck, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function HelpPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loadingChat, setLoadingChat] = useState(false);

  const startSupportChat = async () => {
    if (!session) {
      router.push("/kirish");
      return;
    }
    setLoadingChat(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: "admin_support" }),
      });
      const d = await res.json();
      if (d.chat?.id) {
        if (session.user.role === "provider") {
          router.push(`/provider/chat?chatId=${d.chat.id}`);
        } else if (session.user.role === "admin") {
          router.push(`/admin`);
        } else {
          router.push(`/dashboard/chat?chatId=${d.chat.id}`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChat(false);
    }
  };

  const faqs = [
    {
      icon: <Truck size={24} />,
      title: "Yetkazib berish qanday amalga oshiriladi?",
      desc: "Buyurtmalar do'konlar tomonidan kelishilgan muddatda yetkaziladi. Tayyor mahsulotlar odatda 2–4 soat ichida yo'lga chiqadi."
    },
    {
      icon: <CreditCard size={24} />,
      title: "To'lov usullari qanday?",
      desc: "Hozirda biz Karta orqali o'tkazma (P2P) va mahsulotni qabul qilganda Naqd pul orqali to'lovlarni qabul qilamiz."
    },
    {
      icon: <RefreshCcw size={24} />,
      title: "Mahsulotni qaytarish mumkinmi?",
      desc: "Agar mahsulot sifatsiz bo'lsa yoki tavsifga mos kelmasa, 24 soat ichida qaytarish haqida ariza berishingiz mumkin."
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Buyurtma xavfsizligi kafolatlanganmi?",
      desc: "Ha, biz faqat ishonchli va tekshirilgan do'konlar bilan ishlaymiz. Har bir buyurtma platforma nazoratida bo'ladi."
    }
  ];

  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh", padding: "4rem 1.5rem", color: "var(--dark)" }}>
      <main className="container" style={{ maxWidth: "800px" }}>
        
        <header style={{ textAlign: "center", marginBottom: "4rem" }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "inline-flex", padding: "0.75rem", background: "var(--teal-pale)", color: "var(--teal)", borderRadius: "16px", marginBottom: "1.5rem" }}
          >
            <HelpCircle size={32} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "1rem" }}
          >
            Yordam Markazi
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ color: "var(--gray-500)", fontSize: "1.1rem" }}
          >
            Savollaringiz bormi? Biz yordam berishga tayyormiz.
          </motion.p>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "4rem" }}>
          {faqs.map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              style={{ background: "var(--card-bg)", padding: "2rem", borderRadius: "24px", boxShadow: "var(--shadow-sm)" }}
            >
              <div style={{ color: "var(--teal)", marginBottom: "1rem" }}>{faq.icon}</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "0.75rem" }}>{faq.title}</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--gray-500)", lineHeight: "1.6" }}>{faq.desc}</p>
            </motion.div>
          ))}
        </section>

        <section style={{ background: "var(--teal)", borderRadius: "32px", padding: "3rem", textAlign: "center", color: "white", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "900", marginBottom: "1rem" }}>Hali ham savollaringiz bormi?</h2>
            <p style={{ opacity: 0.8, marginBottom: "2rem" }}>Bizning qo'llab-quvvatlash jamoamiz bilan bog'laning</p>
            <button 
              onClick={startSupportChat}
              disabled={loadingChat}
              className="btn btn-lg" 
              style={{ background: "white", color: "var(--teal)", border: "none", display: "inline-flex", margin: "0 auto" }}
            >
              {loadingChat ? <RefreshCcw className="animate-spin" size={20} /> : <MessageCircle size={20} />} 
              <span style={{ marginLeft: "0.5rem" }}>Jamoaga yozish</span>
            </button>
          </div>
          <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "40%", paddingTop: "40%", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }}></div>
        </section>

      </main>
    </div>
  );
}
