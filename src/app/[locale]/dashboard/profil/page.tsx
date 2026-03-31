"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Save, User } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: session?.user?.name || "",
    phone: (session?.user as any)?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);
  const roleLabel =
    session?.user?.role === "admin"
      ? "Admin"
      : session?.user?.role === "provider"
      ? "Sotuvchi"
      : "Mijoz";

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, phone: form.phone }),
    });
    if (res.ok) {
      await update({ name: form.name });
      toast("Profil yangilandi!", "success");
    } else toast("Xatolik yuz berdi", "error");
    setSaving(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { toast("Parol kamida 6 ta belgidan iborat bo'lishi kerak", "error"); return; }
    setChangingPwd(true);
    const res = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok) { toast("Parol o'zgartirildi!", "success"); setOldPassword(""); setNewPassword(""); }
    else toast(data.error || "Xatolik", "error");
    setChangingPwd(false);
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontWeight: "800", marginBottom: "1.75rem" }}>Profil sozlamalari</h1>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem", padding: "1.5rem", background: "white", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-xs)" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "linear-gradient(135deg, var(--teal), var(--teal-light))",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: "1.75rem", fontWeight: "900",
        }}>
          {(form.name || session?.user?.name)?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: "800", fontSize: "1.1rem" }}>{form.name || session?.user?.name}</div>
          <div style={{ color: "var(--gray-400)", fontSize: "0.875rem" }}>{session?.user?.email}</div>
          <span className="badge badge-gray" style={{ marginTop: "0.375rem", display: "inline-flex" }}>
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={saveProfile} style={{ background: "white", borderRadius: "var(--r-lg)", padding: "1.75rem", boxShadow: "var(--shadow-xs)", marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: "800", fontSize: "1rem", marginBottom: "1.25rem" }}>Asosiy ma&apos;lumotlar</h2>
        <div className="form-group">
          <label className="form-label">Ism va familiya</label>
          <input type="text" className="form-input" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={session?.user?.email || ""} disabled
            style={{ opacity: 0.7, cursor: "not-allowed" }} />
        </div>
        <div className="form-group">
          <label className="form-label">Telefon raqami</label>
          <input type="tel" className="form-input" placeholder="+998 90 123-45-67"
            value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save size={16} /> {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={changePassword} style={{ background: "white", borderRadius: "var(--r-lg)", padding: "1.75rem", boxShadow: "var(--shadow-xs)" }}>
        <h2 style={{ fontWeight: "800", fontSize: "1rem", marginBottom: "1.25rem" }}>Parolni o&apos;zgartirish</h2>
        <div className="form-group">
          <label className="form-label">Joriy parol</label>
          <input type="password" className="form-input" value={oldPassword}
            onChange={e => setOldPassword(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Yangi parol</label>
          <input type="password" className="form-input" placeholder="Kamida 6 ta belgi"
            value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
        </div>
        <button type="submit" className="btn btn-outline" disabled={changingPwd}>
          {changingPwd ? "O'zgartirilmoqda..." : "Parolni o'zgartirish"}
        </button>
      </form>
    </div>
  );
}
