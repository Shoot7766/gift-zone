"use client";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useRouter, Link } from "@/navigation";
import { Gift, Eye, EyeOff, ShieldCheck, Zap, Heart } from "lucide-react";
import { useToast } from "@/components/Toast";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

function RegisterForm() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { toast } = useToast();
  const t = useTranslations("auth");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(redirect as any);
    }
  }, [status, redirect, router]);

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "customer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return setError(t("passwordError") || "Parol kamida 6 ta belgi");

    setLoading(true);
    setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      toast(t("registerSuccess") || "Muvaffaqiyatli ro'yxatdan o'tdingiz!", "success");
      router.push(`/kirish?redirect=${redirect}`);
    } else {
      setError(data.error || "Xatolik ro'y berdi");
    }
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
          </div>
        </div>

        <div style={{ fontSize: "0.9rem", color: "var(--gray-500)", zIndex: 10 }}>
          &copy; {new Date().getFullYear()} Gift Zone platformasi.
        </div>
      </motion.div>

      {/* Right Form Panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: "420px", paddingTop: "2rem", paddingBottom: "2rem" }}>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.5rem", color: "var(--dark)", letterSpacing: "-0.02em" }}
          >
            {t("registerTitle")}
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ color: "var(--gray-500)", fontSize: "1rem", marginBottom: "2rem" }}
          >
            {t("registerSubtitle")}
          </motion.p>

          <motion.form 
            onSubmit={handleSubmit}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
              <button type="button" 
                onClick={() => setForm(p => ({ ...p, role: "customer" }))}
                className={`btn ${form.role === "customer" ? "btn-primary" : "btn-ghost"}`} 
                style={{ flex: 1, borderRadius: "var(--r)", border: form.role !== "customer" ? "1px solid var(--gray-200)" : "none", fontWeight: "700" }}>
                {t("customer")}
              </button>
              <button type="button" 
                onClick={() => setForm(p => ({ ...p, role: "provider" }))}
                className={`btn ${form.role === "provider" ? "btn-primary" : "btn-ghost"}`} 
                style={{ flex: 1, borderRadius: "var(--r)", border: form.role !== "provider" ? "1px solid var(--gray-200)" : "none", fontWeight: "700" }}>
                {t("provider")}
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label" style={{ fontWeight: "600" }}>{t("name")}</label>
              <input type="text" className="form-input" placeholder="Ali Valiyev"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required style={{ padding: "0.875rem 1rem" }} />
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label" style={{ fontWeight: "600" }}>{t("phone")}</label>
              <input type="tel" className="form-input" placeholder="+998"
                value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required style={{ padding: "0.875rem 1rem" }} />
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label" style={{ fontWeight: "600" }}>{t("email")}</label>
              <input type="email" className="form-input" placeholder="example@email.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required style={{ padding: "0.875rem 1rem" }} />
            </div>

            <div className="form-group" style={{ marginBottom: "0.5rem" }}>
              <label className="form-label" style={{ fontWeight: "600" }}>{t("password")}</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} className="form-input" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} minLength={6}
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
                style={{ background: "#FEF2F2", color: "var(--red)", padding: "1rem", borderRadius: "var(--r)", fontSize: "0.9rem", marginTop: "1rem", border: "1px solid #FECACA" }}
              >
                {error}
              </motion.div>
            )}

            <button type="submit" className="btn btn-primary btn-xl" style={{ width: "100%", marginTop: "1.5rem", fontWeight: "800", fontSize: "1.1rem" }} disabled={loading}>
              {loading ? "..." : t("registerBtn")}
            </button>
          </motion.form>

          <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.95rem", color: "var(--gray-500)" }}>
            {t("hasAccount")}{" "}
            <Link href={`/kirish?redirect=${redirect}`} style={{ color: "var(--teal)", fontWeight: "700", textDecoration: "none" }}>
              {t("loginBtn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
