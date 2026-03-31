"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname, Link } from "@/navigation";
import { Package, Settings, MessageSquare, Calendar, Wallet } from "lucide-react";
import { GlobalLoader } from "@/components/Loader";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const tNav = useTranslations("nav");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/kirish");
    if (status === "authenticated" && session?.user?.role === "provider") router.push("/provider");
    if (status === "authenticated" && session?.user?.role === "admin") router.push("/admin");
  }, [status, session]);

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <GlobalLoader />
    </div>
  );

  const navLinks = [
    { href: "/dashboard/buyurtmalar", label: "Buyurtmalarim", icon: <Package size={18} />, exact: true },
    { href: "/hamyon", label: "Hamyon", icon: <Wallet size={18} /> },
    { href: "/dashboard/tadbirlar", label: "Tadbirlarim", icon: <Calendar size={18} /> },
    { href: "/dashboard/chat", label: "Suhbatlar", icon: <MessageSquare size={18} /> },
    { href: "/dashboard/profil", label: tNav("profile"), icon: <Settings size={18} /> },
  ];

  return (
    <div className="dashboard-layout" style={{ minHeight: "80vh", background: "var(--gray-50)", display: "flex" }}>
      {/* Sidebar */}
      <div className="dashboard-sidebar" style={{ width: "260px", background: "white", padding: "1.5rem", borderRight: "1px solid var(--gray-100)" }}>
        <div style={{ padding: "0 0.5rem 1.5rem", borderBottom: "1px solid var(--gray-100)", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--teal-pale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: "800", color: "var(--teal)" }}>
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>{session?.user?.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{tNav("profile")}</div>
            </div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem",
                borderRadius: "10px", textDecoration: "none",
                background: (link.exact ? pathname === link.href : pathname.startsWith(link.href)) ? "var(--teal-pale)" : "transparent",
                color: (link.exact ? pathname === link.href : pathname.startsWith(link.href)) ? "var(--teal)" : "var(--gray-600)",
                fontWeight: "600", fontSize: "0.9rem"
              }}>
              {link.icon} {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="dashboard-content" style={{ flex: 1, padding: "2rem" }}>
        {children}
      </div>
    </div>
  );
}
