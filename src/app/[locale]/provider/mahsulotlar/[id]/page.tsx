"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { GlobalLoader } from "@/components/Loader";
import { useToast } from "@/components/Toast";
import { prepareImageForUpload } from "@/lib/prepareImageForUpload";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [shopId, setShopId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
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
    isActive: true
  });

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const loadData = async () => {
      try {
        // Load categories & cities
        const catRes = await fetch("/api/categories");
        const catData = await catRes.json();
        setCategories(catData.categories || []);
        setCities(catData.cities || []);

        // Load shop info
        const shopRes = await fetch("/api/shops");
        const shopData = await shopRes.json();
        const myShop = shopData.shops?.find((s: any) => s.user_id === session!.user.id);
        if (myShop) setShopId(myShop.id);

        // Load product info
        const prodRes = await fetch(`/api/products/${id}`);
        const prodData = await prodRes.json();
        
        if (prodData.product) {
          const p = prodData.product;
          
          // Basic security check: only the owner should edit
          if (myShop && p.shop_id !== myShop.id) {
            toast("Sizda ushbu mahsulotni tahrirlash huquqi yo'q", "error");
            router.push("/provider/mahsulotlar");
            return;
          }

          setForm({
            title: p.title || "",
            description: p.description || "",
            price: p.price?.toString() || "",
            stockQty: String(p.stock_qty ?? 0),
            lowStockThreshold: String(p.low_stock_threshold ?? 5),
            preparationTime: p.preparation_time || "",
            categoryId: p.category_id?.toString() || "",
            subcategoryId: p.subcategory_id?.toString() || "",
            cityId: p.city_id?.toString() || "",
            isActive: p.is_active === 1 || p.is_active === true
          });
          setImages(p.images?.map((img: any) => img.url) || []);
        }
      } catch (e) {
        toast("Ma'lumotlarni yuklashda xatolik", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session, id]);

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
        toast(data.error || "Rasm yuklashda xatolik", "error");
      }
    } catch {
      toast("Rasm yuklashda xatolik", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: parseFloat(form.price),
          stockQty: parseInt(form.stockQty || "0"),
          lowStockThreshold: parseInt(form.lowStockThreshold || "5"),
          preparationTime: form.preparationTime,
          categoryId: form.categoryId ? parseInt(form.categoryId) : null,
          subcategoryId: form.subcategoryId ? parseInt(form.subcategoryId) : null,
          cityId: form.cityId ? parseInt(form.cityId) : null,
          isActive: form.isActive,
          images,
        }),
      });

      if (res.ok) {
        toast("O'zgarishlar saqlandi!", "success");
        router.push("/provider/mahsulotlar");
      } else {
        toast("Saqlashda xatolik yuz berdi", "error");
      }
    } catch (e) {
      toast("Xatolik yuz berdi", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <GlobalLoader fullScreen />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/provider/mahsulotlar" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Orqaga
        </Link>
        <h1 style={{ fontWeight: "800" }}>Mahsulotni tahrirlash</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "2rem" }}>
          {/* Main info */}
          <div style={{ background: "white", borderRadius: "var(--r-lg)", padding: "2rem", boxShadow: "var(--shadow-xs)" }}>
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

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontWeight: "700" }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} 
                   style={{ width: "20px", height: "20px", accentColor: "var(--teal)" }}
                />
                Mahsulot sotuvda faol (Active)
              </label>
              <p style={{ fontSize: "0.85rem", color: "var(--gray-400)", marginTop: "0.5rem" }}>
                Agar mahsulot vaqtincha tugab qolgan bo'lsa, ushbu galochkani olib qo'ying.
              </p>
            </div>
          </div>

          {/* Images & Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ background: "white", borderRadius: "var(--r-lg)", padding: "1.5rem", boxShadow: "var(--shadow-xs)" }}>
              <h3 style={{ fontWeight: "800", marginBottom: "1.25rem", fontSize: "1rem" }}>Rasmlar</h3>

              {/* Upload zone */}
              <label className="upload-zone" style={{ cursor: "pointer", display: "block", marginBottom: "1rem" }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                <div style={{ textAlign: "center", padding: "1.5rem", border: "2px dashed var(--gray-100)", borderRadius: "var(--r)" }}>
                  {uploading ? (
                    <div style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: "1.5rem" }}>⏳</div>
                  ) : (
                    <Upload size={24} color="var(--gray-400)" style={{ margin: "0 auto 0.5rem" }} />
                  )}
                  <div style={{ fontWeight: "600", color: "var(--gray-600)", fontSize: "0.85rem" }}>
                    {uploading ? "Yuklanmoqda..." : "Rasm qo'shish"}
                  </div>
                  <div style={{ marginTop: "0.25rem", color: "var(--gray-400)", fontSize: "0.75rem" }}>
                    4:3 formatga avtomatik moslanadi
                  </div>
                </div>
              </label>

              {/* Uploaded images list */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--gray-50)" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {i === 0 && (
                      <div style={{ position: "absolute", top: "4px", left: "4px", background: "var(--gold)", color: "white", fontSize: "0.6rem", fontWeight: "800", borderRadius: "4px", padding: "1px 6px", textTransform: "uppercase" }}>Asosiy</div>
                    )}
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={saving}>
                <Save size={18} /> {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      </form>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
