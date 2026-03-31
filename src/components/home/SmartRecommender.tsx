"use client";
import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Gift, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, Link } from "@/navigation";
import { formatPrice } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  products?: any[];
}

export default function SmartRecommender() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", role: "ai", text: "Salom! Men sizning AI sovg'a maslahatchingizman. Kimga va qanday munosabat bilan sovg'a qidiryapsiz? Menga yozing, men eng yaxshi variantlarni topib beraman!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: "ai", 
          text: data.reply,
          products: data.products 
        }]);
      } else {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", text: "Kechirasiz, xatolik yuz berdi. Iltimos qayta urinib ko'ring." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", text: "Kechirasiz, xatolik yuz berdi. Iltimos qayta urinib ko'ring." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--teal), #0d9488)",
          color: "white",
          border: "none",
          boxShadow: "0 10px 25px rgba(20, 184, 166, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 999,
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1) rotate(5deg)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1) rotate(0deg)")}
        title="AI Sovg'a Maslahatchisi bilan yozishish"
      >
        <Sparkles size={28} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                background: "var(--card-bg)",
                width: "100%",
                maxWidth: "480px",
                height: "80vh",
                maxHeight: "700px",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                display: "flex",
                flexDirection: "column"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ background: "linear-gradient(135deg, var(--teal), #0d9488)", padding: "1.5rem", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bot size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontWeight: "800", fontSize: "1.1rem", margin: 0 }}>AI Maslahatchi</h2>
                    <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>Siz uchun eng yaxshi sovg'alarni topaman</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: "rgba(255,255,255,0.2)", border: "none", width: "32px", height: "32px", borderRadius: "50%", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat Area */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", background: "var(--gray-50)" }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ display: "flex", gap: "0.5rem", maxWidth: "85%", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: msg.role === "user" ? "var(--gray-200)" : "var(--teal-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.25rem" }}>
                        {msg.role === "user" ? <User size={14} color="var(--gray-600)" /> : <Bot size={14} color="var(--teal)" />}
                      </div>
                      <div style={{
                        padding: "0.85rem 1rem",
                        borderRadius: "16px",
                        background: msg.role === "user" ? "var(--teal)" : "white",
                        color: msg.role === "user" ? "white" : "var(--dark)",
                        borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                        borderBottomLeftRadius: msg.role === "ai" ? "4px" : "16px",
                        boxShadow: "var(--shadow-sm)",
                        fontSize: "0.95rem",
                        lineHeight: 1.5,
                        border: msg.role === "ai" ? "1px solid var(--gray-100)" : "none"
                      }}>
                        {msg.text}
                      </div>
                    </div>
                    
                    {/* Product Recommendations */}
                    {msg.products && msg.products.length > 0 && (
                      <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", padding: "0.5rem 0 0.5rem 2.5rem", width: "100%", scrollbarWidth: "none" }}>
                        {msg.products.map(p => (
                          <Link href={`/mahsulot/${p.id}`} key={p.id} style={{ flexShrink: 0, width: "140px", background: "var(--card-bg)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--gray-100)", textDecoration: "none", color: "inherit", boxShadow: "var(--shadow-xs)" }}>
                            <div style={{ width: "100%", height: "100px", background: "var(--gray-100)" }}>
                              <img src={p.image_url || `https://picsum.photos/seed/${p.id}/140/100`} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <div style={{ padding: "0.5rem" }}>
                              <div style={{ fontSize: "0.8rem", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.25rem" }}>{p.title}</div>
                              <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "var(--teal)" }}>{formatPrice(p.price)}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", gap: "0.5rem", maxWidth: "85%" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--teal-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Bot size={14} color="var(--teal)" />
                    </div>
                    <div style={{ padding: "0.85rem 1rem", borderRadius: "16px", background: "var(--card-bg)", borderBottomLeftRadius: "4px", boxShadow: "var(--shadow-sm)", display: "flex", gap: "4px", alignItems: "center" }}>
                      <div className="typing-dot" style={{ width: "6px", height: "6px", background: "var(--gray-400)", borderRadius: "50%", animation: "typing 1.4s infinite ease-in-out both" }}></div>
                      <div className="typing-dot" style={{ width: "6px", height: "6px", background: "var(--gray-400)", borderRadius: "50%", animation: "typing 1.4s infinite ease-in-out both", animationDelay: "0.2s" }}></div>
                      <div className="typing-dot" style={{ width: "6px", height: "6px", background: "var(--gray-400)", borderRadius: "50%", animation: "typing 1.4s infinite ease-in-out both", animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: "1rem", background: "var(--card-bg)", borderTop: "1px solid var(--gray-100)" }}>
                <form onSubmit={handleSend} style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Masalan: Onamga 8-mart uchun sovg'a..."
                    style={{ flex: 1, padding: "0.85rem 1.25rem", borderRadius: "99px", border: "1px solid var(--gray-200)", outline: "none", fontSize: "0.95rem", background: "var(--gray-50)" }}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    style={{ width: "46px", height: "46px", borderRadius: "50%", background: input.trim() && !loading ? "var(--teal)" : "var(--gray-200)", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() && !loading ? "pointer" : "not-allowed", transition: "background 0.2s" }}
                  >
                    <Send size={18} style={{ marginLeft: "2px" }} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}
