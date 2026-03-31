"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Plus, Edit, Trash2, Eye } from "lucide-react";

export default function ProviderProducts() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<any[]>([]);
  const [shopId, setShopId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/shops").then(r => r.json()).then(async d => {
      const myShop = d.shops?.find((s: any) => s.user_id === session!.user.id);
      if (myShop) {
        setShopId(myShop.id);
        const res = await fetch(`/api/products?shopId=${myShop.id}`);
        const data = await res.json();
        setProducts(data.products || []);
      }
      setLoading(false);
    });
  }, [session]);

  const deleteProduct = async (id: string) => {
    if (!confirm("Mahsulotni o'chirishni xohlaysizmi?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", fontSize: "2rem" }}>🎁</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontWeight: "800" }}>Mahsulotlar</h1>
        <Link href="/provider/mahsulotlar/yangi" className="btn btn-primary">
          <Plus size={18} /> Yangi mahsulot
        </Link>
      </div>

      {products.length === 0 ? (
        <div style={{ background: "white", borderRadius: "var(--radius)", padding: "5rem 2rem", textAlign: "center", boxShadow: "var(--shadow)" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎁</div>
          <h3 style={{ fontWeight: "700", marginBottom: "0.5rem" }}>Mahsulot yo&apos;q</h3>
          <p style={{ color: "var(--gray-400)", marginBottom: "2rem" }}>Birinchi mahsulotingizni qo&apos;shing</p>
          <Link href="/provider/mahsulotlar/yangi" className="btn btn-primary">
            <Plus size={18} /> Mahsulot qo&apos;shish
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rasm</th>
                <th>Nomi</th>
                <th>Narxi</th>
                <th>Qoldiq</th>
                <th>Reyting</th>
                <th>Buyurtmalar</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <img
                      src={p.primary_image || `https://picsum.photos/seed/${p.id}/80/80`}
                      alt={p.title}
                      style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "10px" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${p.id}/80/80`; }}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: "600", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>{p.category_name}</div>
                  </td>
                  <td style={{ fontWeight: "700" }}>{formatPrice(p.price)}</td>
                  <td>
                    <span
                      className={`badge ${
                        Number(p.stock_qty ?? 0) <= Number(p.low_stock_threshold ?? 5)
                          ? "badge-red"
                          : "badge-green"
                      }`}
                    >
                      {p.stock_qty ?? 0} ta
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>⭐</span>
                      <span style={{ fontWeight: "600" }}>{Number(p.rating).toFixed(1)}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>{p.orders_count}</td>
                  <td>
                    <span className={`badge ${p.is_active ? "badge-green" : "badge-red"}`}>
                      {p.is_active ? "Faol" : "Nofaol"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link href={`/mahsulot/${p.id}`} className="btn btn-ghost btn-sm" title="Ko'rish">
                        <Eye size={15} />
                      </Link>
                      <Link href={`/provider/mahsulotlar/${p.id}`} className="btn btn-ghost btn-sm" title="Tahrirlash">
                        <Edit size={15} />
                      </Link>
                      <button onClick={() => deleteProduct(p.id)} className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} title="O'chirish">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
