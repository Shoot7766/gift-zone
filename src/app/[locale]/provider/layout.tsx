"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname, Link } from "@/navigation";
import { Package, Gift, BarChart2, Store, Plus, MessageSquare, Ticket, CircleUser } from "lucide-react";
import { GlobalLoader } from "@/components/Loader";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const isRu = locale === "ru";
  const [shop, setShop] = useState<{ id: string; name: string } | null>(null);
  const [onboarding, setOnboarding] = useState({
    hasShop: false,
    hasProducts: false,
    hasThreeProducts: false,
    hasOrders: false,
    hasLogo: false,
    hasLocation: false,
    hasWorkingHours: false,
    productCount: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/kirish");
    if (status === "authenticated" && session?.user?.role === "customer") router.push("/dashboard");
    if (status === "authenticated" && session?.user?.role === "admin") router.push("/admin");
  }, [status, session]);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "provider") return;

    // Onboarding auto-routing: keep provider focused on the next required setup step.
    if (!onboarding.hasShop && pathname !== "/provider/dokon") {
      router.push("/provider/dokon");
      return;
    }
    if (onboarding.hasShop && !onboarding.hasProducts && pathname !== "/provider/mahsulotlar/yangi") {
      router.push("/provider/mahsulotlar/yangi");
      return;
    }
    if (
      onboarding.hasShop &&
      onboarding.hasProducts &&
      !onboarding.hasOrders &&
      pathname === "/provider"
    ) {
      router.push("/provider/promo");
    }
  }, [status, session, onboarding, pathname, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/shops")
        .then((r) => r.json())
        .then(async (d) => {
          const myShop = d.shops?.find((s: any) => s.user_id === session!.user.id);
          if (!myShop) {
            setShop(null);
            setOnboarding({
              hasShop: false,
              hasProducts: false,
              hasThreeProducts: false,
              hasOrders: false,
              hasLogo: false,
              hasLocation: false,
              hasWorkingHours: false,
              productCount: 0,
            });
            return;
          }

          setShop(myShop);
          const [productsRes, ordersRes] = await Promise.all([
            fetch(`/api/products?shopId=${encodeURIComponent(myShop.id)}&limit=3`).then((r) => r.json()),
            fetch("/api/provider/orders").then((r) => r.json()),
          ]);

          const productCount = Array.isArray(productsRes.products) ? productsRes.products.length : 0;
          const hasProducts = productCount > 0;
          const hasOrders = Array.isArray(ordersRes.orders) && ordersRes.orders.length > 0;
          setOnboarding({
            hasShop: true,
            hasProducts,
            hasThreeProducts: productCount >= 3,
            hasOrders,
            hasLogo: Boolean(myShop.logo),
            hasLocation:
              myShop.location_lat !== null &&
              myShop.location_lat !== undefined &&
              myShop.location_lng !== null &&
              myShop.location_lng !== undefined,
            hasWorkingHours: Boolean(myShop.working_hours),
            productCount,
          });
        })
        .catch(() => {
          setOnboarding({
            hasShop: false,
            hasProducts: false,
            hasThreeProducts: false,
            hasOrders: false,
            hasLogo: false,
            hasLocation: false,
            hasWorkingHours: false,
            productCount: 0,
          });
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
    { href: "/provider/profil", label: tNav("profile"), icon: <CircleUser size={18} /> },
    { href: "/provider/mahsulotlar/yangi", label: isRu ? "Добавить товар" : "Mahsulot qo'shish", icon: <Plus size={18} /> },
    { href: "/provider/mahsulotlar", label: isRu ? "Товары" : "Mahsulotlar", icon: <Gift size={18} /> },
    { href: "/provider/buyurtmalar", label: tNav("orders"), icon: <Package size={18} /> },
    { href: "/provider/chat", label: isRu ? "Чаты" : "Suhbatlar", icon: <MessageSquare size={18} /> },
    { href: "/provider/promo", label: isRu ? "Промо и шаблоны" : "Promo va shablonlar", icon: <Ticket size={18} /> },
    { href: "/provider/dokon", label: isRu ? "Мой магазин" : "Mening do'konim", icon: <Store size={18} /> },
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
              <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{tNav("myShop") || (isRu ? "Продавец" : "Provider")}</div>
            </div>
          </div>
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
        {!onboarding.hasOrders && (
          (() => {
            const completedSteps =
              (onboarding.hasShop ? 1 : 0) +
              (onboarding.hasProducts ? 1 : 0) +
              (onboarding.hasOrders ? 1 : 0);
            const setupDone =
              (onboarding.hasShop ? 1 : 0) +
              (onboarding.hasLogo ? 1 : 0) +
              (onboarding.hasLocation ? 1 : 0) +
              (onboarding.hasWorkingHours ? 1 : 0) +
              (onboarding.hasThreeProducts ? 1 : 0) +
              (onboarding.hasOrders ? 1 : 0);
            const setupPercent = Math.round((setupDone / 6) * 100);
            const progressPercent = Math.round((completedSteps / 3) * 100);
            return (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              boxShadow: "var(--shadow-xs)",
              padding: "1rem",
              marginBottom: "1rem",
              border: "1px solid var(--gray-100)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: "0.25rem" }}>
              {isRu ? "Быстрый старт продавца" : "Sotuvchi uchun tez start"}
            </div>
            <div style={{ color: "var(--gray-500)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
              {isRu
                ? "Пошагово завершите запуск магазина."
                : "Quyidagi bosqichlarni tugatib, do'konni ishga tushiring."}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--gray-500)", fontWeight: 700 }}>
                {isRu ? "Прогресс запуска" : "Ishga tushirish progressi"}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--teal)", fontWeight: 800 }}>
                {completedSteps}/3
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--gray-500)", fontWeight: 700 }}>
                {isRu ? "Готовность магазина" : "Do'kon tayyorligi"}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--gold-dark)", fontWeight: 800 }}>
                {setupPercent}%
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: "10px",
                background: "var(--gray-100)",
                borderRadius: "999px",
                overflow: "hidden",
                marginBottom: "0.9rem",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--teal), var(--gold-dark))",
                  borderRadius: "999px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                background: "var(--gray-100)",
                borderRadius: "999px",
                overflow: "hidden",
                marginBottom: "0.9rem",
              }}
            >
              <div
                style={{
                  width: `${setupPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--gold-dark), var(--teal))",
                  borderRadius: "999px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.75rem" }}>
              <Link
                href="/provider/dokon"
                className="btn btn-ghost"
                style={{ justifyContent: "space-between", border: "1px solid var(--gray-100)" }}
              >
                <span>{onboarding.hasShop ? "✅ " : "1. "}{isRu ? "Мой магазин" : "Mening do'konim"}</span>
              </Link>
              <Link
                href="/provider/mahsulotlar/yangi"
                className="btn btn-ghost"
                style={{ justifyContent: "space-between", border: "1px solid var(--gray-100)" }}
              >
                <span>
                  {onboarding.hasProducts ? "✅ " : "2. "}
                  {isRu ? "Добавить товар" : "Mahsulot qo'shish"}
                  {onboarding.productCount > 0 ? ` (${onboarding.productCount})` : ""}
                </span>
              </Link>
              <Link
                href="/provider/buyurtmalar"
                className="btn btn-ghost"
                style={{ justifyContent: "space-between", border: "1px solid var(--gray-100)" }}
              >
                <span>{onboarding.hasOrders ? "✅ " : "3. "}{isRu ? "Заказы" : "Buyurtmalar"}</span>
              </Link>
            </div>
          </div>
            );
          })()
        )}
        {children}
      </div>
    </div>
  );
}
