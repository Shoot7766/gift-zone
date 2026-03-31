"use client";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check } from "lucide-react";

const languages = [
  { code: "uz", label: "O'zbek (Lot)", flag: "🇺🇿" },
  { code: "uz-cyrl", label: "Ўзбек (Кир)", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇺🇸" }
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === locale) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="lang-switcher" ref={containerRef} style={{ position: "relative", zIndex: 1000 }}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.5rem 0.75rem", borderRadius: "var(--r)",
          background: "white", border: "1.5px solid var(--gray-200)",
          cursor: "pointer", fontWeight: "700", fontSize: "0.85rem",
          color: "var(--dark)", boxShadow: "var(--shadow-xs)"
        }}
      >
        <Globe size={16} color="var(--teal)" />
        <span className="lang-label">{currentLang.label.split(' ')[0]}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} color="var(--gray-400)" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "white", borderRadius: "12px", padding: "0.5rem",
              minWidth: "160px", boxShadow: "var(--shadow-lg), 0 0 0 1px rgba(0,0,0,0.05)",
              overflow: "hidden"
            }}
          >
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                whileHover={{ background: "var(--gray-50)", x: 4 }}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "0.75rem", borderRadius: "8px",
                  border: "none", background: "transparent", cursor: "pointer",
                  textAlign: "left", fontSize: "0.875rem", fontWeight: "600",
                  color: locale === lang.code ? "var(--teal)" : "var(--gray-700)",
                  transition: "color 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span>{lang.flag}</span>
                  {lang.label}
                </div>
                {locale === lang.code && <Check size={14} />}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
