"use client";
import Link from "next/link";
import { ArrowRight, Gift, Store } from "lucide-react";
import { motion } from "framer-motion";
export default function CTASection() {
  return (
    <section style={{ background: "linear-gradient(135deg, var(--teal) 0%, #1A3A2A 50%, var(--teal-mid) 100%)", padding: "clamp(4rem, 8vw, 7rem) var(--page-pad)", position: "relative", overflow: "hidden" }}>
      {/* Background decorations */}
      <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,149,42,0.1) 0%, transparent 70%)", top: "-200px", right: "-100px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(64,145,108,0.15) 0%, transparent 70%)", bottom: "-100px", left: "-100px", pointerEvents: "none" }} />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <motion.div 
            animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "inline-block", padding: "1.5rem", background: "rgba(255,255,255,0.1)", borderRadius: "50%", marginBottom: "1.5rem" }}
          >
            <Gift size={48} color="white" />
          </motion.div>
          <h2 style={{ color: "white", fontSize: "clamp(1.75rem, 4vw, 3rem)", fontWeight: "900", marginBottom: "1.25rem", letterSpacing: "-0.02em" }}>
            Birinchi sovg&apos;angizni{" "}
            <span style={{ background: "linear-gradient(135deg, var(--gold-light), var(--gold-glow))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              hoziroq
            </span>{" "}
            buyurtma qiling
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.1rem", lineHeight: "1.7", marginBottom: "2.5rem" }}>
            Tanlangan do'konlar, xavfsiz to'lov va sifatli xizmat bilan sevimli insoningizni quvontiring.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/katalog" className="btn btn-primary btn-xl">
              Xarid qilishni boshlash <ArrowRight size={20} />
            </Link>
            <Link href="/royxat?role=provider" className="btn btn-glass btn-xl">
              <Store size={20} /> Do&apos;kon ochish
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "2rem", justifyContent: "center", marginTop: "3rem", flexWrap: "wrap" }}>
            {["✨ Premium tanlov", "✅ Bepul ro'yxatdan o'tish", "💳 Click & Payme"].map((s) => (
              <span key={s} style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", fontWeight: "600" }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
