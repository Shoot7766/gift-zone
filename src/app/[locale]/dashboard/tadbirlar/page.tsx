"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Plus, Trash2, Gift, Clock, Star, ArrowRight } from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function UserEventsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newReminder, setNewReminder] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await fetch("/api/user-events");
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newDate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/user-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, date: newDate, reminderDays: newReminder }),
      });
      if (res.ok) {
        toast("Tadbir muvaffaqiyatli qo'shildi", "success");
        setNewName("");
        setNewDate("");
        setShowAddForm(false);
        loadEvents();
      }
    } catch (e) {
      toast("Xatolik yuz berdi", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Haqiqatdan ham o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/user-events?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Tadbir o'chirildi", "info");
        setEvents(prev => prev.filter(e => e.id !== id));
      }
    } catch (e) {
      toast("Xatolik", "error");
    }
  };

  const getDaysUntil = (dateStr: string) => {
     const today = new Date();
     const target = new Date(dateStr);
     // If date is in the past and recurring, adjust year
     if (target < today) target.setFullYear(today.getFullYear() + 1);
     
     const diffTime = target.getTime() - today.getTime();
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
     return diffDays;
  };

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
        <div>
          <h1 style={{ fontWeight: "900", marginBottom: "0.5rem" }}>Tadbirlarim</h1>
          <p style={{ color: "var(--gray-500)" }}>Yaqinlaringiz bayramlarini esda saqlang va sovg'alar rejalashtiring.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
           <Plus size={20} /> Yangi qo'shish
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center" }}>Yuklanmoqda...</div>
      ) : events.length === 0 && !showAddForm ? (
        <div style={{ background: "white", padding: "5rem 2rem", borderRadius: "24px", textAlign: "center", boxShadow: "var(--shadow-xs)" }}>
           <Calendar size={64} color="var(--teal-pale)" style={{ margin: "0 auto 1.5rem" }} />
           <h3 style={{ fontWeight: "800", marginBottom: "1rem" }}>Hali tadbirlar yo'q</h3>
           <p style={{ color: "var(--gray-500)", marginBottom: "2rem", maxWidth: "400px", margin: "0 auto 2rem" }}>
             Tug'ilgan kunlar, yubileylar yoki boshqa muhim sanalarni kiriting. Biz sizni oldindan ogohlantiramiz.
           </p>
           <button onClick={() => setShowAddForm(true)} className="btn btn-primary btn-lg">Birinchi tadbirni qo'shish</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem" }}>
           <AnimatePresence>
             {showAddForm && (
               <motion.div 
                 initial={{ opacity: 0, y: -20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 style={{ background: "white", padding: "2rem", borderRadius: "24px", boxShadow: "var(--shadow-md)", border: "2px solid var(--teal-pale)" }}
               >
                 <h3 style={{ fontWeight: "800", marginBottom: "1.5rem" }}>Yangi Tadbir</h3>
                 <form onSubmit={handleAddEvent} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: "1rem", alignItems: "end" }}>
                   <div>
                     <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.5rem" }}>Tadbir nami</label>
                     <input value={newName} onChange={e => setNewName(e.target.value)} type="text" className="form-input" placeholder="Dadamning tug'ilgan kuni..." required />
                   </div>
                   <div>
                     <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.5rem" }}>Sana</label>
                     <input value={newDate} onChange={e => setNewDate(e.target.value)} type="date" className="form-input" required />
                   </div>
                   <button type="submit" disabled={submitting} className="btn btn-primary" style={{ height: "48px" }}>
                      {submitting ? "..." : "Saqlash"}
                   </button>
                 </form>
                 <button onClick={() => setShowAddForm(false)} className="btn btn-ghost btn-sm" style={{ marginTop: "1rem" }}>Bekor qilish</button>
               </motion.div>
             )}
           </AnimatePresence>

           {events.map((event) => {
             const days = getDaysUntil(event.date);
             const isSoon = days <= event.reminder_days;

             return (
               <motion.div 
                 layout
                 key={event.id}
                 style={{ 
                   background: "white", padding: "1.5rem 2rem", borderRadius: "24px", boxShadow: "var(--shadow-xs)", 
                   display: "flex", justifyContent: "space-between", alignItems: "center",
                   border: isSoon ? "1.5px solid #FCD34D" : "1px solid var(--gray-100)"
                 }}
               >
                 <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                   <div style={{ 
                      width: "64px", height: "64px", borderRadius: "16px", 
                      background: isSoon ? "#FFFBEB" : "var(--gray-50)", 
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                   }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "700", color: isSoon ? "#B45309" : "var(--gray-400)" }}>
                        {new Date(event.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                      </span>
                      <span style={{ fontSize: "1.5rem", fontWeight: "900", color: isSoon ? "#B45309" : "var(--dark)" }}>
                        {new Date(event.date).getDate()}
                      </span>
                   </div>
                   <div>
                     <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "0.25rem" }}>{event.name}</h3>
                     <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", color: isSoon ? "#B45309" : "var(--gray-500)", fontWeight: "600" }}>
                           {isSoon ? `🔥 ${days} kun qoldi!` : `${days} kundan keyin`}
                        </span>
                        {event.gifts?.length > 0 && (
                          <span style={{ fontSize: "0.85rem", color: "var(--teal)", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                             <Gift size={14} /> {event.gifts.length} ta sovg'a
                          </span>
                        )}
                     </div>
                   </div>
                 </div>

                 <div style={{ display: "flex", gap: "1rem" }}>
                    {event.gifts?.length > 0 ? (
                      <div style={{ display: "flex", gap: "-10px", alignItems: "center" }}>
                        {event.gifts.map((g: any, i: number) => (
                           <img key={i} src={g.image_url} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid white", objectFit: "cover", marginLeft: i > 0 ? "-12px" : 0 }} />
                        ))}
                      </div>
                    ) : (
                      <Link href="/katalog" className="btn btn-outline btn-sm">
                         <Star size={14} /> Sovg'a tanlash
                      </Link>
                    )}
                    <button onClick={() => handleDeleteEvent(event.id)} className="btn btn-ghost" style={{ color: "var(--red-pale)", padding: "0.5rem" }}>
                       <Trash2 size={20} />
                    </button>
                 </div>
               </motion.div>
             );
           })}
        </div>
      )}
    </div>
  );
}
