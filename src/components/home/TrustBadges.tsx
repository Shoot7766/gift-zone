"use client";
import { ShieldCheck, Truck, Gem, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function TrustBand() {
  const t = useTranslations("home");
  const items = [
    { icon: <ShieldCheck size={22} color="var(--teal)" />, bg: "var(--teal-pale)", label: t("trust4"), sub: t("trust4Desc") },
    { icon: <Truck size={22} color="var(--blue)" />, bg: "var(--blue-pale)", label: t("trust3"), sub: t("trust3Desc") },
    { icon: <Gem size={22} color="var(--gold-dark)" />, bg: "var(--gold-pale)", label: t("featuredTitle"), sub: t("featuredEyebrow") },
    { icon: <HeartPulse size={22} color="var(--purple)" />, bg: "var(--purple-pale)", label: t("howTitle"), sub: t("step4") },
  ];

  return (
    <div className="trust-band" style={{ background: "transparent", padding: "2.5rem 0", borderBottom: "1px solid var(--gray-100)" }}>
      <div className="container">
        <motion.div 
          className="trust-band-inner" 
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.15 } }
          }}
        >
          {items.map((item) => (
            <motion.div 
              key={item.label} 
              className="trust-item" 
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
              }}
              style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem" }}
            >
              <div className="trust-icon" style={{ 
                width: "48px", height: "48px", borderRadius: "var(--r)", 
                background: item.bg, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: "800", color: "var(--dark)", fontSize: "0.95rem", marginBottom: "0.2rem" }}>{item.label}</div>
                <div style={{ color: "var(--gray-400)", fontSize: "0.8rem", fontWeight: "500" }}>{item.sub}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 900px) { div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 500px) { div[style*="repeat(4, 1fr)"] { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
