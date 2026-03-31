"use client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function GlobalLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  const t = useTranslations("common");
  const content = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
        <Loader2 size={40} color="var(--teal)" strokeWidth={2.5} />
      </motion.div>
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }} 
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--teal)", letterSpacing: "0.05em", textTransform: "uppercase" }}
      >
        {t("loading")}
      </motion.div>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
      {content}
    </div>
  );
}

export function EmojiEmpty({ icon, title, desc }: { icon: React.ReactNode, title: string, desc?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      style={{ textAlign: "center", padding: "4rem 2rem" }}
    >
      <motion.div 
        animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}
      >
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--teal-pale)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px rgba(27,67,50,0.1)" }}>
          {icon}
        </div>
      </motion.div>
      <h3 style={{ fontWeight: "800", marginBottom: "0.5rem", fontSize: "1.25rem", color: "var(--dark)" }}>{title}</h3>
      {desc && <p style={{ color: "var(--gray-500)", fontSize: "0.95rem" }}>{desc}</p>}
    </motion.div>
  );
}
