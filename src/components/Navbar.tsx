"use client";
import { Link, usePathname, useRouter } from "@/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  ShoppingCart, ChevronDown,
  Package, LayoutDashboard, Store, Shield, LogOut,
  LogIn, UserPlus, Heart, Search, MessageCircle, CircleUser
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.items.reduce((t, i) => t + i.quantity, 0));
  const { items: wishlistItems, setItems: setWishlistItems } = useWishlistStore();
  const wishlistCount = wishlistItems.length;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcement, setAnnouncement] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/wishlist").then(r => r.json()).then(d => {
        if (d.items) setWishlistItems(d.items);
      }).catch(console.error);

      // Fetch unread count
      const fetchUnread = () => {
        fetch("/api/notifications/unread").then(r => r.json()).then(d => {
          setUnreadCount(d.unreadChats || 0);
        }).catch(() => {});
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 60000); // 1 min poll
      return () => clearInterval(interval);
    }
  }, [session, setWishlistItems]);

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [pathname]);
  
  useEffect(() => {
    fetch("/api/admin/broadcast")
      .then((r) => r.json())
      .then((d) => {
        const first = d.announcements?.[0];
        if (first) setAnnouncement({ title: first.title, message: first.message });
      })
      .catch(() => {});
  }, [session?.user?.role]);

  const dashHref = session?.user?.role === "admin" ? "/admin"
    : session?.user?.role === "provider" ? "/provider" : "/dashboard/buyurtmalar";
  const profileHref =
    session?.user?.role === "customer" ? "/dashboard/profil" : dashHref;
  const isCustomerRole = !session?.user?.role || session.user.role === "customer";

  const navLinks = [
    { href: "/katalog", label: t("catalog") },
    { href: "/dokonlar", label: t("shops") },
  ];

  const userMenuItems = session
    ? session.user?.role === "admin"
      ? [
          { href: profileHref, label: "Profil", icon: <CircleUser size={16} /> },
          { href: "/admin", label: t("adminPanel") || "Boshqaruv paneli", icon: <Shield size={16} /> },
          { href: "/hamyon", label: "Hamyon", icon: <ShoppingCart size={16} /> },
        ]
      : session.user?.role === "provider"
      ? [
          { href: profileHref, label: "Profil", icon: <CircleUser size={16} /> },
          { href: "/provider", label: t("dashboard"), icon: <LayoutDashboard size={16} /> },
          { href: "/hamyon", label: "Hamyon", icon: <ShoppingCart size={16} /> },
          { href: "/provider/buyurtmalar", label: t("orders") || "Buyurtmalar", icon: <Package size={16} /> },
          { href: "/provider/chat", label: "Xabarlar", icon: <MessageCircle size={16} /> },
          { href: "/provider/dokon", label: t("myShop") || "Do'konim", icon: <Store size={16} /> },
        ]
      : [
          { href: profileHref, label: "Profil", icon: <CircleUser size={16} /> },
          { href: dashHref, label: "Buyurtmalarim", icon: <LayoutDashboard size={16} /> },
          { href: "/hamyon", label: "Hamyon", icon: <ShoppingCart size={16} /> },
          { href: "/dashboard/buyurtmalar", label: t("orders") || "Buyurtmalar", icon: <Package size={16} /> },
          {
            href: "/dashboard/chat",
            label: "Xabarlar",
            icon: (
              <div style={{ position: "relative" }}>
                <MessageCircle size={16} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-8px",
                      width: "12px",
                      height: "12px",
                      background: "var(--red)",
                      border: "2px solid white",
                      borderRadius: "50%",
                    }}
                  />
                )}
              </div>
            ),
          },
        ]
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/katalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  return (
    <>
      {announcement && (
        <div
          style={{
            background: "var(--teal)",
            color: "white",
            padding: "0.45rem 1rem",
            textAlign: "center",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <strong>{announcement.title}:</strong> {announcement.message}
        </div>
      )}
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/" className="navbar-logo" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img
              src="/api/site-logo?v=3"
              alt="Gift Zone"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                objectFit: "cover",
                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
              }}
            />
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "var(--dark)" }}>Gift Zone</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--gray-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Zarafshon
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="navbar-nav desktop-only">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`navbar-link${pathname.startsWith(link.href) ? " active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSearch} className="desktop-only" style={{ flex: 1, maxWidth: "300px", margin: "0 2rem", position: "relative" }}>
             <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
             <input 
                type="text" 
                placeholder="Sovg'a izlash..." 
                className="form-input" 
                style={{ width: "100%", paddingLeft: "2.5rem", borderRadius: "100px", background: "var(--gray-50)", border: "1px solid var(--gray-200)", fontSize: "0.85rem", height: "38px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </form>

          {/* Right side */}
          <div className="navbar-right">
            <div className="desktop-only" style={{ marginRight: "0.5rem", gap: "0.5rem", alignItems: "center" }}>
              <LanguageSwitcher />
            </div>

            {/* Wishlist */}
            {isCustomerRole && (
              <Link href="/sevimlilar" className="cart-btn" aria-label="Sevimlilar" style={{ marginRight: "0.25rem", color: "var(--red)" }}>
                <Heart size={20} />
                {wishlistCount > 0 && <span className="cart-count" style={{ background: "var(--red)" }}>{wishlistCount}</span>}
              </Link>
            )}

            {/* Cart */}
            {isCustomerRole && (
              <Link href="/savat" className="cart-btn" aria-label={t("cart")}>
                <ShoppingCart size={20} />
                {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
              </Link>
            )}

            {/* User menu / auth */}
            {session ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.5rem 0.875rem", borderRadius: "var(--r)",
                    border: "2px solid var(--gray-200)", background: "var(--card-bg)",
                    cursor: "pointer", fontFamily: "Outfit, sans-serif",
                    fontWeight: "700", fontSize: "0.9rem", color: "var(--dark)",
                    transition: "all var(--t-fast)",
                    position: "relative",
                  }}
                >
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--teal), var(--teal-light))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: "0.78rem", fontWeight: "800", flexShrink: 0,
                  }}>
                    {session.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="desktop-only" style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {session.user?.name?.split(" ")[0]}
                  </span>
                  <ChevronDown size={14} style={{ transition: "transform var(--t-fast)", transform: userMenuOpen ? "rotate(180deg)" : "none", flexShrink: 0 }} />
                  {unreadCount > 0 && (
                    <span style={{ 
                      position: "absolute", top: "-6px", right: "-6px", 
                      width: "16px", height: "16px", background: "var(--red)", 
                      color: "white", fontSize: "10px", fontWeight: "900", 
                      borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid var(--card-bg)", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {userMenuOpen && (
                  <>
                    <div onClick={() => setUserMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0,
                      background: "var(--card-bg)", borderRadius: "var(--r-lg)", padding: "0.5rem",
                      minWidth: "200px", boxShadow: "var(--shadow-lg)",
                      zIndex: 99, animation: "scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      transformOrigin: "top right",
                    }}>
                      <div style={{ padding: "0.75rem 0.875rem", borderBottom: "1px solid var(--gray-100)", marginBottom: "0.5rem" }}>
                        <div style={{ fontWeight: "800", fontSize: "0.9rem" }}>{session.user?.name}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--gray-400)" }}>{session.user?.email}</div>
                      </div>
                      {userMenuItems.map((item, index) => (
                        <Link key={`${item.href}-${index}`} href={item.href} style={{
                          display: "flex", alignItems: "center", gap: "0.625rem",
                          padding: "0.625rem 0.875rem", borderRadius: "var(--r-sm)",
                          textDecoration: "none", color: "var(--gray-700)",
                          fontWeight: "600", fontSize: "0.9rem",
                          transition: "all var(--t-fast)",
                        }} onClick={() => setUserMenuOpen(false)}
                          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = "var(--gray-50)")}
                          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ color: "var(--teal)" }}>{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                      <div style={{ borderTop: "1px solid var(--gray-100)", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
                        <button
                          onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.625rem",
                            padding: "0.625rem 0.875rem", borderRadius: "var(--r-sm)",
                            background: "none", border: "none", cursor: "pointer",
                            color: "var(--red)", fontWeight: "600", fontSize: "0.9rem",
                            fontFamily: "inherit", width: "100%", textAlign: "left",
                            transition: "all var(--t-fast)",
                          }}
                          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = "var(--red-pale)")}
                          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = "transparent")}
                        >
                          <LogOut size={16} /> {t("logout")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link href="/kirish" className="btn btn-ghost btn-sm" style={{ color: "var(--gray-700)" }}>
                  <LogIn size={16} /> {t("login")}
                </Link>
                <Link href="/royxat" className="btn btn-primary btn-sm">
                  <UserPlus size={15} /> {t("register")}
                </Link>
              </div>
            )}

          </div>
        </div>
      </nav>

      <style>{`
        .desktop-only { display: flex; }
        @media (max-width: 768px) { .desktop-only { display: none !important; } }
      `}</style>
    </>
  );
}
