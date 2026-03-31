"use client";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/navigation";
import { Home, ShoppingBag, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      const fetchUnread = () => {
        fetch("/api/notifications/unread").then(r => r.json()).then(d => {
          setUnreadCount(d.unreadChats || 0);
        }).catch(() => {});
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 60000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Customer-only mobile bottom nav
  if (
    pathname.includes("/kirish") ||
    pathname.includes("/royxat") ||
    pathname.includes("/provider") ||
    pathname.includes("/admin") ||
    session?.user?.role === "provider" ||
    session?.user?.role === "admin"
  ) {
    return null;
  }

  const navItems = [
    { label: t("home") || "Bosh", icon: <Home size={22} />, href: "/" },
    { label: t("cart") || "Savat", icon: <ShoppingBag size={22} />, href: "/savat" },
    { label: t("profile") || "Profil", icon: <User size={22} />, href: session ? "/dashboard/profil" : "/kirish" },
  ];

  return (
    <>
      <div className="bottom-nav-spacer"></div>
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isProfile = item.label === t("profile") || item.label === "Profil";
          
          return (
            <Link key={item.label} href={item.href} className={`bottom-nav-item ${isActive ? "active" : ""}`}>
              <div style={{ position: "relative" }}>
                {item.icon}
                {isProfile && unreadCount > 0 && (
                  <span style={{ 
                    position: "absolute", top: "-2px", right: "-2px", 
                    width: "12px", height: "12px", background: "var(--red)", 
                    border: "2px solid white", borderRadius: "50%" 
                  }}></span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        .bottom-nav-spacer { display: none; }
        .bottom-nav { display: none; }

        @media (max-width: 768px) {
          .bottom-nav-spacer {
            display: block;
            height: 70px; /* height of bottom nav */
          }
          .bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 70px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-top: 1px solid var(--gray-100);
            box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
            z-index: 50;
            padding-bottom: env(safe-area-inset-bottom);
          }
          .bottom-nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            color: var(--gray-400);
            text-decoration: none;
            transition: all 0.2s;
            position: relative;
          }
          .bottom-nav-item span {
            font-size: 0.65rem;
            font-weight: 600;
          }
          .bottom-nav-item.active {
            color: var(--teal);
          }
          .bottom-nav-item.active::before {
            content: '';
            position: absolute;
            top: 0;
            width: 32px;
            height: 3px;
            background: var(--teal);
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
          }
          
          /* Hide normal footer on mobile maybe? Actually let's just let it be there, but add spacer */
          body {
            padding-bottom: 70px; /* extra safe space */
          }
        }
      `}</style>
    </>
  );
}
