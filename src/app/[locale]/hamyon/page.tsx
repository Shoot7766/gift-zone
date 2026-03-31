"use client";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Wallet, PlusCircle, History } from "lucide-react";

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => {
        setBalance(Number(d.balance || 0));
        setTransactions(d.transactions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const topup = async () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return alert("Summani to'g'ri kiriting");
    setSaving(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "To'ldirishda xatolik");
      } else {
        setAmount("");
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Yuklanmoqda...</div>;

  return (
    <div style={{ padding: "2rem 1.5rem", background: "var(--gray-50)", minHeight: "100vh" }}>
      <main className="container" style={{ maxWidth: "900px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div style={{ background: "linear-gradient(135deg, var(--teal-dark), var(--teal))", color: "white", borderRadius: "20px", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.9, fontWeight: 700 }}>
              <Wallet size={18} /> Hamyon balansi
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.5rem" }}>{formatPrice(balance)}</div>
          </div>
          <div style={{ background: "white", borderRadius: "20px", padding: "1.5rem", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: 800 }}>
              <PlusCircle size={18} /> Hamyonni to&apos;ldirish
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input className="form-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100000" style={{ width: "100%" }} />
              <button className="btn btn-primary" onClick={topup} disabled={saving}>{saving ? "..." : "To'ldirish"}</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "1.25rem", background: "white", borderRadius: "20px", boxShadow: "var(--shadow-xs)" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--gray-100)", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <History size={18} /> Tranzaksiyalar
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--gray-500)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                  <th style={{ textAlign: "left", padding: "0.75rem 1rem" }}>Vaqt</th>
                  <th style={{ textAlign: "left", padding: "0.75rem 1rem" }}>Tur</th>
                  <th style={{ textAlign: "left", padding: "0.75rem 1rem" }}>Izoh</th>
                  <th style={{ textAlign: "right", padding: "0.75rem 1rem" }}>Summa</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} style={{ borderTop: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "0.9rem 1rem", fontSize: "0.85rem", color: "var(--gray-500)" }}>{new Date(t.created_at).toLocaleString()}</td>
                    <td style={{ padding: "0.9rem 1rem", fontWeight: 700 }}>{t.type}</td>
                    <td style={{ padding: "0.9rem 1rem", color: "var(--gray-600)" }}>{t.note || "-"}</td>
                    <td style={{ padding: "0.9rem 1rem", textAlign: "right", fontWeight: 800, color: Number(t.amount) >= 0 ? "var(--green)" : "var(--red)" }}>{formatPrice(Number(t.amount))}</td>
                  </tr>
                ))}
                {!transactions.length && (
                  <tr><td colSpan={4} style={{ padding: "1.5rem", textAlign: "center", color: "var(--gray-500)" }}>Hali tranzaksiya yo&apos;q</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
