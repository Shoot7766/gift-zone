"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Save } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function ProviderProfilePage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: session?.user?.name || "",
    phone: (session?.user as { phone?: string } | undefined)?.phone || "",
  });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      });
      if (!res.ok) {
        toast("Xatolik yuz berdi", "error");
        return;
      }
      await update({ name: form.name });
      toast("Profil yangilandi!", "success");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "680px" }}>
      <h1 style={{ fontWeight: 800, marginBottom: "1.5rem" }}>Sotuvchi profili</h1>
      <form
        onSubmit={saveProfile}
        style={{
          background: "white",
          borderRadius: "var(--r-lg)",
          padding: "1.75rem",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div className="form-group">
          <label className="form-label">Ism va familiya</label>
          <input
            type="text"
            className="form-input"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={session?.user?.email || ""} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Telefon</label>
          <input
            type="tel"
            className="form-input"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+998 90 123-45-67"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save size={16} /> {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </form>
    </div>
  );
}
