"use client";
import { Link } from "@/navigation";
import { Phone, Send, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  const links = {
    platform: [
      { href: "/katalog", label: tNav("catalog") },
      { href: "/dokonlar", label: tNav("shops") },
      { href: "/royxat?role=provider", label: tNav("myShop") || "Do'kon ochish" },
    ],
    help: [
      { href: "/yordam", label: t("help") },
      { href: "/yordam?q=yetkazish", label: t("delivery") },
      { href: "/yordam?q=qaytarish", label: t("returns") },
      { href: "/yordam?q=xavfsizlik", label: t("security") },
    ],
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.9rem", marginBottom: "1rem" }}>
              <img
                src="/api/site-logo?v=3"
                alt="Gift Zone"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  objectFit: "cover",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                }}
              />
              <div className="footer-logo" style={{ marginBottom: 0 }}>
                Gift <span>Zone</span>
              </div>
            </Link>
            <p style={{ fontSize: "0.9rem", lineHeight: "1.7", marginBottom: "1.5rem", maxWidth: "320px" }}>{t("desc")}</p>
            <div style={{ display: "flex", gap: "0.625rem" }}>
              {[
                { icon: <Send size={16} />, href: "https://t.me/giftzone_vercel_app", label: "Telegram" },
                { icon: <ExternalLink size={16} />, href: "https://instagram.com/sovgauz", label: "Instagram" },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{
                    width: "38px", height: "38px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.7)", transition: "all 0.2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--gold)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div>
            <div className="footer-title">{t("platform")}</div>
            {links.platform.map((l) => (
              <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
            ))}
          </div>

          {/* Help */}
          <div>
            <div className="footer-title">{t("help")}</div>
            {links.help.map((l) => (
              <Link key={l.href} href={l.href as any} className="footer-link">{l.label}</Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <div className="footer-title">{t("contact")}</div>
            {[
              { icon: <Phone size={14} />, label: "+998933100764" },
            ].map((c) => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem", color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--gold-light)", flexShrink: 0 }}>{c.icon}</span>
                {c.label}
              </div>
            ))}
            <div style={{ marginTop: "1.25rem" }}>
              <div className="footer-title" style={{ marginBottom: "0.75rem", fontSize: "0.82rem" }}>{t("payment")}</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[t("paymentCard"), t("paymentCash")].map((p) => (
                  <span key={p} style={{
                    padding: "3px 10px", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700",
                    color: "rgba(255,255,255,0.7)",
                  }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)" }}>
            © {new Date().getFullYear()} Gift Zone — {t("rights")}
          </span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/maxfiylik" className="footer-bottom-link">{t("privacy")}</Link>
            <Link href="/shartlar" className="footer-bottom-link">{t("terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
