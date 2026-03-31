"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prepareImageForUpload } from "@/lib/prepareImageForUpload";

export default function NewProductPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [shopId, setShopId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    stockQty: "0",
    lowStockThreshold: "5",
    preparationTime: "",
    categoryId: "",
    subcategoryId: "",
    cityId: "",
  });

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/shops").then(r => r.json()).then(d => {
      const myShop = d.shops?.find((s: any) => s.user_id === session!.user.id);
      if (myShop) setShopId(myShop.id);
    });
    fetch("/api/categories").then(r => r.json()).then(d => {
      setCategories(d.categories || []);
      setCities(d.cities || []);
    });
  }, [session]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const preparedFile = await prepareImageForUpload(file, {
        aspectRatio: 4 / 3,
        maxWidth: 1600,
        maxHeight: 1200,
      });
      const formData = new FormData();
      formData.append("file", preparedFile);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setImages((prev) => [...prev, data.url]);
      } else {
        alert(data.error || "Rasm yuklanmadi");
      }
    } catch {
      alert("Rasmni tayyorlashda xatolik");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) { alert("Avval do'kon yarating"); return; }
    setSaving(true);

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        stockQty: parseInt(form.stockQty || "0"),
        lowStockThreshold: parseInt(form.lowStockThreshold || "5"),
        preparationTime: form.preparationTime,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        subcategoryId: form.subcategoryId ? parseInt(form.subcategoryId) : null,
        cityId: form.cityId ? parseInt(form.cityId) : null,
        images,
      }),
    });

    if (res.ok) {
      router.push("/provider/mahsulotlar");
    } else {
      alert("Xatolik yuz berdi");
    }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/provider/mahsulotlar" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Orqaga
        </Link>
        <h1 style={{ fontWeight: "800" }}>Yangi mahsulot qo&apos;shish</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "2rem" }}>
          {/* Main info */}
          <div style={{ background: "white", borderRadius: "var(--radius)", padding: "2rem", boxShadow: "var(--shadow)" }}>
            <div className="form-group">
              <label className="form-label">Mahsulot nomi *</label>
              <input type="text" className="form-input" placeholder="Misol: 51 ta qizil atirgul buketi"
                value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Tavsif</label>
              <textarea className="form-input" placeholder="Mahsulot haqida batafsil yozing..."
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                style={{ minHeight: "140px" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Narxi (so&apos;m) *</label>
                <input type="number" className="form-input" placeholder="150000"
                  value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Tayyorlash vaqti</label>
                <input type="text" className="form-input" placeholder="2–3 soat"
                  value={form.preparationTime} onChange={e => setForm(p => ({ ...p, preparationTime: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Ombordagi soni</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={form.stockQty}
                  onChange={e => setForm(p => ({ ...p, stockQty: e.target.value }))}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kam qoldiq chegarasi</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="5"
                  value={form.lowStockThreshold}
                  onChange={e => setForm(p => ({ ...p, lowStockThreshold: e.target.value }))}
                  min="0"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Kategoriya</label>
                <select className="form-input form-select"
                  value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value, subcategoryId: "" }))}>
                  <option value="">Tanlang</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subkategoriya</label>
                <select className="form-input form-select"
                  value={form.subcategoryId} onChange={e => setForm(p => ({ ...p, subcategoryId: e.target.value }))}>
                  <option value="">Tanlang</option>
                  {(categories.find((c: any) => String(c.id) === String(form.categoryId))?.subcategories || [])
                    .map((s: any) => <option key={s.id} value={s.id}>{s.icon || ""} {s.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Shahar</label>
                <select className="form-input form-select"
                  value={form.cityId} onChange={e => setForm(p => ({ ...p, cityId: e.target.value }))}>
                  <option value="">Tanlang</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <div style={{ background: "white", borderRadius: "var(--radius)", padding: "2rem", boxShadow: "var(--shadow)" }}>
              <h3 style={{ fontWeight: "700", marginBottom: "1.25rem" }}>Rasmlar</h3>

              {/* Upload zone */}
              <label className="upload-zone" style={{ cursor: "pointer", display: "block" }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                <div style={{ textAlign: "center" }}>
                  {uploading ? (
                    <div style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: "2rem" }}>⏳</div>
                  ) : (
                    <Upload size={32} color="var(--gray-400)" style={{ margin: "0 auto 0.75rem" }} />
                  )}
                  <div style={{ fontWeight: "600", color: "var(--gray-600)", marginBottom: "0.25rem" }}>
                    {uploading ? "Yuklanmoqda..." : "Rasm yuklash"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>JPG/PNG/WEBP (max 5MB), 4:3 ga moslanadi</div>
                </div>
              </label>

              {/* Uploaded images */}
              {images.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "1rem" }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: "10px", overflow: "hidden" }}>
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {i === 0 && (
                        <div style={{ position: "absolute", top: "4px", left: "4px", background: "var(--gold)", color: "white", fontSize: "0.65rem", fontWeight: "700", borderRadius: "4px", padding: "1px 6px" }}>Asosiy</div>
                      )}
                      <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                        style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }} disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Mahsulotni saqlash"}
              </button>
            </div>
          </div>
        </div>
      </form>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
