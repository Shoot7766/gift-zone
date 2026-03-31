"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/navigation";

export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = String(params.locale || "uz");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    }).catch(() => null);
    setLoading(false);
    setDone(true);
  };

  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "var(--card-bg)", border: "1px solid var(--gray-100)", borderRadius: "16px", padding: "1.2rem" }}>
        <h2 style={{ marginBottom: "0.6rem" }}>Parolni tiklash</h2>
        <p style={{ color: "var(--gray-500)", marginBottom: "1rem", fontSize: "0.92rem" }}>
          Emailingizni kiriting. Agar hisob mavjud bo'lsa, tiklash havolasi yuboriladi.
        </p>
        {done ? (
          <div style={{ color: "var(--teal)" }}>
            Xabar yuborildi (agar email mavjud bo'lsa). <Link href="/kirish">Kirishga qaytish</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              style={{ width: "100%", marginBottom: "1rem" }}
            />
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "..." : "Havola yuborish"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

