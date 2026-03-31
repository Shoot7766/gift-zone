"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname, Link } from "@/navigation";
import { Package, Gift, BarChart2, Store, Plus, MessageSquare, Ticket } from "lucide-react";
import { GlobalLoader } from "@/components/Loader";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tProduct = useTranslations("product");
  const [shop, setShop] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/kirish");
    if (status === "authenticated" && session?.user?.role === "customer") router.push("/dashboard");
    if (status === "authenticated" && session?.user?.role === "admin") router.push("/admin");
  }, [status, session]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/shops").then(r => r.json()).then(d => {
        const myShop = d.shops?.find((s: any) => s.user_id === session!.user.id);
        if (myShop) setShop(myShop);
      });
    }
  }, [session]);

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <GlobalLoader />
    </div>
  );

  const navLinks = [
    { href: "/provider", label: tNav("dashboard"), icon: <BarChart2 size={18} />, exact: true },
    { href: "/provider/mahsulotlar", label: tNav("catalog"), icon: <Gift size={18} /> },
    { href: "/provider/buyurtmalar", label: tNav("orders"), icon: <Package size={18} /> },
    { href: "/provider/chat", label: "Suhbatlar", icon: <MessageSquare size={18} /> },
    { href: "/provider/promo", label: "Promo va shablonlar", icon: <Ticket size={18} /> },
    { href: "/provider/dokon", label: tNav("myShop") || "Do'kon profili", icon: <Store size={18} /> },
  ];

  return (
    <div className="dashboard-layout" style={{ minHeight: "80vh", background: "var(--gray-50)", display: "flex" }}>
      {/* Sidebar */}
      <div className="dashboard-sidebar" style={{ width: "260px", background: "white", padding: "1.5rem", borderRight: "1px solid var(--gray-100)" }}>
        <div style={{ padding: "0 0.5rem 1.5rem", borderBottom: "1px solid var(--gray-100)", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--teal-pale)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Store size={22} color="var(--teal)" />
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>{shop?.name || session?.user?.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{tNav("myShop") || "Provider"}</div>
            </div>
          </div>
          <Link href="/provider/mahsulotlar/yangi" className="btn btn-primary btn-sm" style={{ width: "100%", borderRadius: "8px" }}>
            <Plus size={14} /> {tProduct("addProduct")}
          </Link>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {navLinks.map(link => {
            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}
                className="sidebar-link"
                style={{
                  display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1.25rem",
                  borderRadius: "16px", textDecoration: "none",
                  background: isActive ? "var(--teal)" : "transparent",
                  color: isActive ? "white" : "var(--gray-600)",
                  fontWeight: "700", fontSize: "0.95rem",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isActive ? "0 10px 15px -3px rgba(20, 184, 166, 0.4)" : "none"
                }}>
                <span style={{ transform: isActive ? "scale(1.1)" : "none", transition: "transform 0.2s" }}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="dashboard-content" style={{ flex: 1, padding: "2rem" }}>
        {children}
      </div>
    </div>
  );
}
