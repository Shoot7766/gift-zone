"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Save, Store } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { prepareImageForUpload } from "@/lib/prepareImageForUpload";

export default function ProviderShopPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", phone: "", telegram: "", address: "",
    workingHours: "", logo: "", deliveryFee: "20000",
    pickupAvailable: true,
    shopDeliveryAvailable: true,
    defaultPreparationTime: "",
    pickupInstructions: "",
    locationLat: "",
    locationLng: "",
  });

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/shops").then(r => r.json()).then(d => {
      const myShop = d.shops?.find((s: any) => s.user_id === session!.user.id);
      if (myShop) {
        setShopId(myShop.id);
        setForm({
          name: myShop.name || "",
          description: myShop.description || "",
          phone: myShop.phone || "",
          telegram: myShop.telegram || "",
          address: myShop.address || "",
          workingHours: myShop.working_hours || "",
          logo: myShop.logo || "",
          deliveryFee: myShop.delivery_fee?.toString() || "20000",
          pickupAvailable: myShop.pickup_available !== 0,
          shopDeliveryAvailable: myShop.shop_delivery_available !== 0,
          defaultPreparationTime: myShop.default_preparation_time || "",
          pickupInstructions: myShop.pickup_instructions || "",
          locationLat: myShop.location_lat != null ? String(myShop.location_lat) : "",
          locationLng: myShop.location_lng != null ? String(myShop.location_lng) : "",
        });
      }
      setLoading(false);
    });
  }, [session]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const preparedFile = await prepareImageForUpload(file, {
        aspectRatio: 1,
        maxWidth: 720,
        maxHeight: 720,
        quality: 0.88,
      });
      const fd = new FormData();
      fd.append("file", preparedFile);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setForm((p) => ({ ...p, logo: data.url }));
        toast("Logo yuklandi", "success");
      } else {
        toast(data.error || "Logo yuklashda xatolik", "error");
      }
    } catch {
      toast("Logo tayyorlashda xatolik", "error");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const method = shopId ? "PATCH" : "POST";
    const url = shopId ? `/api/shops/${shopId}` : "/api/shops";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        phone: form.phone,
        telegram: form.telegram,
        address: form.address || null,
        workingHours: form.workingHours,
        logo: form.logo,
        deliveryFee: parseInt(form.deliveryFee) || 20000,
        pickupAvailable: form.pickupAvailable,
        shopDeliveryAvailable: form.shopDeliveryAvailable,
        defaultPreparationTime: form.defaultPreparationTime || null,
        pickupInstructions: form.pickupInstructions || null,
        locationLat: form.locationLat ? parseFloat(form.locationLat) : null,
        locationLng: form.locationLng ? parseFloat(form.locationLng) : null,
      }),
    });

    if (res.ok) {
      const d = await res.json();
      if (!shopId) setShopId(d.shopId);
      toast("Do'kon ma'lumotlari saqlandi!", "success");
    } else {
      toast("Xatolik yuz berdi", "error");
    }
    setSaving(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", fontSize: "2rem" }}>🏪</div>;

  return (
    <div>
      <h1 style={{ fontWeight: "800", marginBottom: "1.75rem" }}>
        {shopId ? "Do'kon profilini tahrirlash" : "Do'kon yaratish"}
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }}>
          {/* Main info */}
          <div style={{ background: "white", borderRadius: "var(--r-lg)", padding: "2rem", boxShadow: "var(--shadow-xs)" }}>
            <h3 style={{ fontWeight: "800", marginBottom: "1.25rem", fontSize: "1rem" }}>Asosiy ma&apos;lumotlar</h3>

            <div className="form-group">
              <label className="form-label">Do&apos;kon nomi *</label>
              <input type="text" className="form-input" placeholder="GulShop Toshkent"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Tavsif</label>
              <textarea className="form-input" placeholder="Do'koningiz haqida qisqacha ma'lumot bering..."
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                style={{ minHeight: "100px" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Telefon raqami</label>
                <input type="tel" className="form-input" placeholder="+998 90 123-45-67"
                  value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Telegram</label>
                <input type="text" className="form-input" placeholder="@dokonism"
                  value={form.telegram} onChange={e => setForm(p => ({ ...p, telegram: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Ish vaqti</label>
                <input type="text" className="form-input" placeholder="09:00 – 22:00"
                  value={form.workingHours} onChange={e => setForm(p => ({ ...p, workingHours: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Do&apos;kon manzili (olib ketish va ko&apos;rsatish uchun)</label>
              <input type="text" className="form-input" placeholder="Toshkent, Chilonzor 12-uy"
                value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Lokatsiya (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="40.12345"
                  value={form.locationLat}
                  onChange={(e) => setForm((p) => ({ ...p, locationLat: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lokatsiya (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="65.12345"
                  value={form.locationLng}
                  onChange={(e) => setForm((p) => ({ ...p, locationLng: e.target.value }))}
                />
              </div>
            </div>
            {form.locationLat && form.locationLng && (
              <div className="form-group">
                <label className="form-label">Xaritada ko&apos;rish</label>
                <iframe
                  title="shop-map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(`${form.locationLat},${form.locationLng}`)}&z=15&output=embed`}
                  style={{ width: "100%", height: "260px", border: "1px solid var(--gray-200)", borderRadius: "12px" }}
                  loading="lazy"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Yetkazib berish narxi (so&apos;m)</label>
              <input type="number" className="form-input" placeholder="20000"
                value={form.deliveryFee} onChange={e => setForm(p => ({ ...p, deliveryFee: e.target.value }))} min="0" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", cursor: "pointer" }}>
                <input type="checkbox" checked={form.pickupAvailable} onChange={e => setForm(p => ({ ...p, pickupAvailable: e.target.checked }))} />
                Olib ketish (pickup)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", cursor: "pointer" }}>
                <input type="checkbox" checked={form.shopDeliveryAvailable} onChange={e => setForm(p => ({ ...p, shopDeliveryAvailable: e.target.checked }))} />
                Do&apos;kon yetkazib beradi
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Taxminiy tayyorlanish vaqti</label>
              <input type="text" className="form-input" placeholder="Masalan: 30–45 daqiqa"
                value={form.defaultPreparationTime} onChange={e => setForm(p => ({ ...p, defaultPreparationTime: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Olib ketish bo&apos;yicha ko&apos;rsatmalar</label>
              <textarea className="form-input" placeholder="Kassa yonida, 2-qavat..."
                value={form.pickupInstructions} onChange={e => setForm(p => ({ ...p, pickupInstructions: e.target.value }))}
                style={{ minHeight: "72px" }} />
            </div>

          </div>

          {/* Logo & Save */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "white", borderRadius: "var(--r-lg)", padding: "1.5rem", boxShadow: "var(--shadow-xs)" }}>
              <h3 style={{ fontWeight: "800", marginBottom: "1.25rem", fontSize: "1rem" }}>Logo</h3>

              {form.logo ? (
                <div style={{ marginBottom: "1rem", position: "relative" }}>
                  <img src={form.logo} alt="Logo" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "var(--r)" }} />
                  <button type="button" onClick={() => setForm(p => ({ ...p, logo: "" }))}
                    style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                    ×
                  </button>
                </div>
              ) : (
                <label className="upload-zone" style={{ display: "block", cursor: "pointer", marginBottom: "1rem" }}>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                  <div style={{ textAlign: "center" }}>
                    {uploadingLogo ? <div style={{ fontSize: "2rem", animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</div>
                      : <Store size={32} color="var(--gray-400)" style={{ margin: "0 auto 0.5rem" }} />}
                    <div style={{ fontWeight: "600", color: "var(--gray-500)", fontSize: "0.9rem" }}>
                      {uploadingLogo ? "Yuklanmoqda..." : "Logo yuklash"}
                    </div>
                    <div style={{ marginTop: "0.25rem", color: "var(--gray-400)", fontSize: "0.75rem" }}>
                      1:1 formatga avtomatik moslanadi
                    </div>
                  </div>
                </label>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={saving}>
              <Save size={18} /> {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>

            {shopId && (
              <Link href={`/dokon/${shopId}`} className="btn btn-ghost" style={{ width: "100%", border: "1px solid var(--gray-200)" }}>
                Do&apos;konni ko&apos;rish →
              </Link>
            )}
          </div>
        </div>
      </form>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
