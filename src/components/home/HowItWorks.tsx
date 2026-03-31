"use client";
import { Search, ShoppingCart, CreditCard, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function HowItWorks() {
  const t = useTranslations("home");

  const steps = [
    {
      icon: <Search size={36} color="var(--blue)" strokeWidth={2} />,
      bg: "var(--blue-pale)", title: t("step1"), desc: t("step1Desc"),
    },
    {
      icon: <ShoppingCart size={36} color="var(--teal)" strokeWidth={2} />,
      bg: "var(--teal-pale)", title: t("step2"), desc: t("step2Desc"),
    },
    {
      icon: <CreditCard size={36} color="var(--gold-dark)" strokeWidth={2} />,
      bg: "var(--gold-pale)", title: t("step3"), desc: t("step3Desc"),
    },
    {
      icon: <Gift size={36} color="var(--purple)" strokeWidth={2} />,
      bg: "var(--purple-pale)", title: t("step4"), desc: t("step4Desc"),
    },
  ];

  return (
    <section className="section" style={{ background: "transparent", borderTop: "1px solid var(--gray-100)" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div className="section-eyebrow" style={{ justifyContent: "center" }}>Sovg&apos;a.uz</div>
          <h2 className="section-title">
            {t("howTitle")}
          </h2>
          <p style={{ color: "var(--gray-500)", marginTop: "0.75rem", maxWidth: "480px", margin: "0.75rem auto 0" }}>
            {t("marketingDesc") || "O'zbekistondagi eng katta sovg'alar platformasi."}
          </p>
        </div>

        <motion.div 
          className="how-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.2 } }
          }}
        >
          <div className="how-connector" />
          {steps.map((step, i) => (
            <motion.div 
              key={i} 
              className="how-step"
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, type: "spring", stiffness: 100 } }
              }}
            >
              <div className="how-icon-wrap" style={{ background: step.bg, width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                {step.icon}
                <div className="how-num">{i + 1}</div>
              </div>
              <h3 className="how-title">{step.title}</h3>
              <p className="how-desc">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
