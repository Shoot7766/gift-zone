"use client";
import { useState, Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useParams } from "next/navigation";
import { useRouter, Link } from "@/navigation";
import { Gift, Eye, EyeOff, ShieldCheck, Zap, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

function LoginForm() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const t = useTranslations("auth");

  useEffect(() => {
    if (status === "authenticated") {
       router.replace(redirect as any);
    }
  }, [status, redirect, router]);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (res?.error) {
      setError(locale === 'uz' ? "Email yoki parol noto'g'ri" : "Неверный email или пароль");
      setLoading(false);
    } else {
      router.push(redirect as any);
      router.refresh();
    }
  };

  const fillDemo = (role: string) => {
    if (role === "admin") setForm({ email: "admin@sovga.uz", password: "admin123" });
    if (role === "customer") setForm({ email: "user@sovga.uz", password: "user123" });
    if (role === "provider") setForm({ email: "shop1@sovga.uz", password: "shop123" });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--warm-white)" }}>
      {/* Left Marketing Panel */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="auth-panel" 
        style={{ 
          flex: 1, 
          background: "linear-gradient(135deg, var(--teal) 0%, #112F22 100%)", 
          color: "white", 
          padding: "4rem", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: "-10%", left: "-10%", width: "50%", paddingTop: "50%", background: "radial-gradient(circle, rgba(201,149,42,0.15) 0%, transparent 70%)", borderRadius: "50%" }}
        ></motion.div>
        
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", zIndex: 10 }}>
          <Gift size={36} color="var(--gold)" strokeWidth={2.5} />
          <span style={{ fontSize: "2rem", fontWeight: "900", color: "white", letterSpacing: "-0.02em" }}>
            Sovg&apos;<span style={{ color: "var(--gold)" }}>a</span>.uz
          </span>
        </Link>

        <div style={{ zIndex: 10 }}>
          <h1 style={{ fontSize: "3rem", fontWeight: "900", lineHeight: "1.1", marginBottom: "1.5rem" }}>
            {t("marketingTitle")}
          </h1>
          <p style={{ fontSize: "1.2rem", color: "var(--gray-300)", marginBottom: "3rem", maxWidth: "80%", lineHeight: "1.6" }}>
            {t("marketingDesc")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
               <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldCheck size={24} color="var(--gold)" /></div>
               <div><div style={{ fontWeight: "700", fontSize: "1.1rem" }}>{t("safe")}</div><div style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>Kafolatlangan xizmat</div></div>
             </div>
             <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
               <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={24} color="var(--gold)" /></div>
               <div><div style={{ fontWeight: "700", fontSize: "1.1rem" }}>{t("fast")}</div><div style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>O'z vaqtida manzilda</div></div>
             </div>
             <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
               <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Heart size={24} color="var(--gold)" /></div>
               <div><div style={{ fontWeight: "700", fontSize: "1.1rem" }}>{t("premium")}</div><div style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>Eng sara mahsulotlar</div></div>
             </div>
          </div>
        </div>

        <div style={{ fontSize: "0.9rem", color: "var(--gray-500)", zIndex: 10 }}>
          &copy; {new Date().getFullYear()} Gift Zone platformasi.
        </div>
      </motion.div>

      {/* Right Form Panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.5rem", color: "var(--dark)", letterSpacing: "-0.02em" }}
          >
            {t("loginTitle")} <motion.span animate={{ rotate: [0, 20, 0, 20, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 1 }} style={{ display: "inline-block" }}>👋</motion.span>
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ color: "var(--gray-500)", fontSize: "1rem", marginBottom: "2.5rem" }}
          >
            {t("loginSubtitle")}
          </motion.p>

          <motion.form 
            onSubmit={handleSubmit}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" style={{ fontWeight: "600" }}>{t("email")}</label>
              <input type="email" className="form-input" placeholder="example@email.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required 
                style={{ padding: "0.875rem 1rem" }} />
            </div>

            <div className="form-group" style={{ marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label className="form-label" style={{ marginBottom: 0, fontWeight: "600" }}>{t("password")}</label>
                <Link href="#" style={{ fontSize: "0.85rem", color: "var(--teal)", fontWeight: "600", textDecoration: "none" }}>{t("forgotPassword")}</Link>
              </div>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} className="form-input" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{ padding: "0.875rem 3rem 0.875rem 1rem" }} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)" }}>
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ background: "#FEF2F2", color: "var(--red)", padding: "1rem", borderRadius: "var(--r)", fontSize: "0.9rem", marginTop: "1.5rem", border: "1px solid #FECACA" }}
              >
                {error}
              </motion.div>
            )}

            <button type="submit" className="btn btn-primary btn-xl" style={{ width: "100%", marginTop: "2rem", fontWeight: "800", fontSize: "1.1rem" }} disabled={loading}>
              {loading ? "..." : t("loginBtn")}
            </button>
          </motion.form>

          <div style={{ textAlign: "center", marginTop: "2.5rem", fontSize: "0.95rem", color: "var(--gray-500)" }}>
            {t("noAccount")}{" "}
            <Link href={`/royxat?redirect=${redirect}`} style={{ color: "var(--teal)", fontWeight: "700", textDecoration: "none" }}>
              {t("registerTitle")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
