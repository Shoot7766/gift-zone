"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useLocale } from "next-intl";

type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  is_active: number;
  used_count: number;
  usage_limit: number | null;
  expires_at: string | null;
};

type QuickReply = {
  id: string;
  title: string;
  message: string;
};

export default function ProviderPromoPage() {
  const { toast } = useToast();
  const locale = useLocale();
  const isRu = locale === "ru";
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percent",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    usageLimit: "",
    expiresAt: "",
  });
  const [replyForm, setReplyForm] = useState({ title: "", message: "" });

  const loadAll = async () => {
    setLoading(true);
    const [cRes, qRes] = await Promise.all([
      fetch("/api/provider/coupons").then((r) => r.json()),
      fetch("/api/provider/quick-replies").then((r) => r.json()),
    ]);
    setCoupons(cRes.coupons || []);
    setQuickReplies(qRes.quickReplies || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/provider/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: couponForm.code,
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minOrderAmount: Number(couponForm.minOrderAmount || 0),
        maxDiscountAmount: couponForm.maxDiscountAmount
          ? Number(couponForm.maxDiscountAmount)
          : null,
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
        expiresAt: couponForm.expiresAt || null,
      }),
    });
    if (!res.ok) {
      toast("Kupon yaratib bo'lmadi", "error");
      return;
    }
    toast("Kupon yaratildi", "success");
    setCouponForm({
      code: "",
      discountType: "percent",
      discountValue: "",
      minOrderAmount: "",
      maxDiscountAmount: "",
      usageLimit: "",
      expiresAt: "",
    });
    loadAll();
  };

  const toggleCoupon = async (id: string, isActive: boolean) => {
    await fetch("/api/provider/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    loadAll();
  };

  const deleteCoupon = async (id: string) => {
    await fetch(`/api/provider/coupons?id=${id}`, { method: "DELETE" });
    loadAll();
  };

  const createQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/provider/quick-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(replyForm),
    });
    if (!res.ok) {
      toast("Shablon saqlanmadi", "error");
      return;
    }
    setReplyForm({ title: "", message: "" });
    toast("Shablon saqlandi", "success");
    loadAll();
  };

  const deleteQuickReply = async (id: string) => {
    await fetch(`/api/provider/quick-replies?id=${id}`, { method: "DELETE" });
    loadAll();
  };

  if (loading) return <div style={{ padding: "2rem" }}>{isRu ? "Загрузка..." : "Yuklanmoqda..."}</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
      <section style={{ background: "white", borderRadius: 20, padding: "1.25rem", boxShadow: "var(--shadow-xs)" }}>
        <h2 style={{ fontWeight: 900, marginBottom: "1rem" }}>{isRu ? "Промо-купоны" : "Promo kuponlar"}</h2>
        <form onSubmit={createCoupon} style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <input className="form-input" placeholder="Kod (WELCOME10)" value={couponForm.code} onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} required />
            <select className="form-input" value={couponForm.discountType} onChange={(e) => setCouponForm((p) => ({ ...p, discountType: e.target.value }))}>
              <option value="percent">Foiz (%)</option>
              <option value="fixed">Qat'iy summa</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            <input className="form-input" type="number" placeholder="Chegirma" value={couponForm.discountValue} onChange={(e) => setCouponForm((p) => ({ ...p, discountValue: e.target.value }))} required />
            <input className="form-input" type="number" placeholder="Min buyurtma" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm((p) => ({ ...p, minOrderAmount: e.target.value }))} />
            <input className="form-input" type="number" placeholder="Max chegirma" value={couponForm.maxDiscountAmount} onChange={(e) => setCouponForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <input className="form-input" type="number" placeholder="Foydalanish limiti" value={couponForm.usageLimit} onChange={(e) => setCouponForm((p) => ({ ...p, usageLimit: e.target.value }))} />
            <input className="form-input" type="datetime-local" value={couponForm.expiresAt} onChange={(e) => setCouponForm((p) => ({ ...p, expiresAt: e.target.value }))} />
          </div>
          <button className="btn btn-primary" type="submit"><Plus size={16} /> {isRu ? "Добавить купон" : "Kupon qo'shish"}</button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {coupons.map((c) => (
            <div key={c.id} style={{ border: "1px solid var(--gray-100)", borderRadius: 12, padding: "0.75rem", display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800 }}>{c.code}</div>
                <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                  {c.discount_type === "percent" ? `${c.discount_value}%` : `${c.discount_value} so'm`} • ishlatilgan: {c.used_count}/{c.usage_limit ?? "∞"}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleCoupon(c.id, !!c.is_active)}>
                  {c.is_active ? "O'chirish" : "Faollashtirish"}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} onClick={() => deleteCoupon(c.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "white", borderRadius: 20, padding: "1.25rem", boxShadow: "var(--shadow-xs)" }}>
        <h2 style={{ fontWeight: 900, marginBottom: "1rem" }}>{isRu ? "Шаблоны быстрых ответов" : "Quick Reply shablonlar"}</h2>
        <form onSubmit={createQuickReply} style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
          <input className="form-input" placeholder="Qisqa nomi" value={replyForm.title} onChange={(e) => setReplyForm((p) => ({ ...p, title: e.target.value }))} required />
          <textarea className="form-input" placeholder="Xabar matni" style={{ minHeight: 90 }} value={replyForm.message} onChange={(e) => setReplyForm((p) => ({ ...p, message: e.target.value }))} required />
          <button className="btn btn-primary" type="submit"><Plus size={16} /> {isRu ? "Добавить шаблон" : "Shablon qo'shish"}</button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {quickReplies.map((r) => (
            <div key={r.id} style={{ border: "1px solid var(--gray-100)", borderRadius: 12, padding: "0.75rem", display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <div>
                <div style={{ fontWeight: 800 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: "var(--gray-500)" }}>{r.message}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} onClick={() => deleteQuickReply(r.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

