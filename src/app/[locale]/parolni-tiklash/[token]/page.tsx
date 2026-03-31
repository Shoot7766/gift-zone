"use client";

import { useState } from "react";
import { useParams, useRouter, Link } from "@/navigation";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Parollar mos emas");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Xatolik yuz berdi");
      return;
    }
    setMessage("Parol yangilandi. Endi tizimga kiring.");
    setTimeout(() => router.push("/kirish"), 1200);
  };

  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "var(--card-bg)", border: "1px solid var(--gray-100)", borderRadius: "16px", padding: "1.2rem" }}>
        <h2 style={{ marginBottom: "0.6rem" }}>Yangi parol</h2>
        <p style={{ color: "var(--gray-500)", marginBottom: "1rem", fontSize: "0.92rem" }}>
          Kamida 8 belgi: katta/kichik harf, raqam va maxsus belgi.
        </p>
        {message ? (
          <div style={{ color: "var(--teal)" }}>{message}</div>
        ) : (
          <form onSubmit={onSubmit}>
            <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Yangi parol" required style={{ width: "100%", marginBottom: "0.7rem" }} />
            <input type="password" className="form-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Parolni tasdiqlang" required style={{ width: "100%", marginBottom: "0.8rem" }} />
            {error && <div style={{ color: "var(--red)", marginBottom: "0.8rem" }}>{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "..." : "Parolni yangilash"}
            </button>
          </form>
        )}
        <div style={{ marginTop: "0.8rem" }}>
          <Link href="/kirish">Kirishga qaytish</Link>
        </div>
      </div>
    </div>
  );
}

