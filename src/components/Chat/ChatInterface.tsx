"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Send, User, Store, Check, CheckCheck, MessageSquare } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Message {
  id: number;
  chatId: string;
  senderId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

interface Chat {
  id: string;
  customerId: string;
  shopId: string;
  lastMessage?: string;
  updatedAt: string;
  customer_name?: string;
  customer_avatar?: string;
  shop_name?: string;
  shop_logo?: string;
}

interface QuickReply {
  id: string;
  title: string;
  message: string;
}

export default function ChatInterface({ type }: { type: "customer" | "provider" }) {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(true);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadChats();
    if (type === "provider") {
      fetch("/api/provider/quick-replies")
        .then((r) => r.json())
        .then((d) => setQuickReplies(d.quickReplies || []))
        .catch(() => {});
    }
    const interval = setInterval(loadChats, 10000); // Poll chats every 10s
    return () => clearInterval(interval);
  }, [type]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      const interval = setInterval(() => loadMessages(selectedChat.id, true), 3000); // Poll messages every 3s
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 900 && selectedChat) {
      setMobileListOpen(false);
    }
  }, [selectedChat]);

  const loadChats = async () => {
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      if (data.chats) setChats(data.chats);
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  const loadMessages = async (chatId: string, silent = false) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages((prev) => {
          if (silent && data.messages.length === prev.length) return prev;
          return data.messages;
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMessage }),
      });
      if (res.ok) {
        setNewMessage("");
        loadMessages(selectedChat.id);
      }
    } catch (e) { console.error(e); }
    setSending(false);
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Yuklanmoqda...</div>;

  return (
    <div className="chat-shell">
      
      {/* Sidebar: Chats List */}
      <div className={`chat-sidebar${mobileListOpen ? " mobile-open" : ""}`}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--gray-100)", fontWeight: "800", fontSize: "1.25rem" }}>
           Suhbatlar
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {chats.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--gray-400)", fontSize: "0.9rem" }}>
              Hali suhbatlar yo'q
            </div>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => {
                  setSelectedChat(chat);
                  if (typeof window !== "undefined" && window.innerWidth <= 900) {
                    setMobileListOpen(false);
                  }
                }}
                style={{
                  width: "100%", padding: "1.25rem", border: "none", borderBottom: "1px solid var(--gray-50)",
                  background: selectedChat?.id === chat.id ? "var(--teal-pale)" : "var(--card-bg)",
                  display: "flex", gap: "1rem", alignItems: "center", textAlign: "left", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--gray-100)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   {type === "customer" ? (
                     chat.shop_logo ? <img src={chat.shop_logo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Store size={20} color="var(--gray-400)" />
                   ) : (
                     chat.customer_avatar ? <img src={chat.customer_avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} color="var(--gray-400)" />
                   )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                   <div style={{ fontWeight: "700", marginBottom: "0.25rem", color: "var(--dark)" }}>
                      {type === "customer" ? chat.shop_name : chat.customer_name}
                   </div>
                   <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {chat.lastMessage || "Suhbatni boshlang..."}
                   </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`chat-main${mobileListOpen ? " mobile-hidden" : ""}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div style={{ padding: "1rem 1.5rem", background: "var(--card-bg)", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "1rem" }}>
               <button
                 type="button"
                 onClick={() => setMobileListOpen(true)}
                 className="chat-back-btn"
                 aria-label="Suhbatlar ro'yxatiga qaytish"
               >
                 Orqaga
               </button>
               <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--teal-pale)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {type === "customer" ? <Store size={18} color="var(--teal)" /> : <User size={18} color="var(--teal)" />}
               </div>
               <div style={{ fontWeight: "800" }}>{type === "customer" ? selectedChat.shop_name : selectedChat.customer_name}</div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
               {messages.map((msg) => {
                 const isMine = msg.senderId === session?.user?.id;
                 return (
                  <div key={msg.id} style={{ alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "min(70%, 520px)" }}>
                      <div style={{
                        padding: "0.75rem 1rem", borderRadius: "16px",
                        background: isMine ? "var(--teal)" : "var(--card-bg)",
                        color: isMine ? "white" : "var(--dark)",
                        boxShadow: "var(--shadow-xs)",
                        border: isMine ? "none" : "1px solid var(--gray-100)",
                        borderBottomRightRadius: isMine ? "4px" : "16px",
                        borderBottomLeftRadius: isMine ? "16px" : "4px",
                      }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", marginTop: "0.25rem", textAlign: isMine ? "right" : "left", display: "flex", alignItems: "center", justifyContent: isMine ? "flex-end" : "flex-start", gap: "0.25rem" }}>
                         {formatDateTime(msg.createdAt).split(" ")[1]}
                         {isMine && (msg.isRead ? <CheckCheck size={12} color="var(--teal)" /> : <Check size={12} />)}
                      </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "1.25rem", background: "var(--card-bg)", borderTop: "1px solid var(--gray-100)" }}>
               {type === "provider" && quickReplies.length > 0 && (
                 <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                   {quickReplies.slice(0, 6).map((reply) => (
                     <button
                       key={reply.id}
                       type="button"
                       className="btn btn-ghost btn-sm"
                       onClick={() => setNewMessage(reply.message)}
                       title={reply.message}
                       style={{ borderRadius: "999px" }}
                     >
                       {reply.title}
                     </button>
                   ))}
                 </div>
               )}
               <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "0.75rem" }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Xabaringizni yozing..."
                    style={{ flex: 1, padding: "0.85rem 1.25rem", borderRadius: "12px", border: "1px solid var(--gray-200)", outline: "none", fontSize: "0.95rem", background: "var(--card-bg)", color: "var(--dark)" }}
                  />
                  <button type="submit" disabled={!newMessage.trim() || sending} className="btn btn-primary" style={{ borderRadius: "12px", width: "48px", height: "48px", padding: 0 }}>
                    <Send size={20} />
                  </button>
               </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--gray-400)", padding: "1rem" }}>
             <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <MessageSquare size={40} />
             </div>
             <h3 style={{ textAlign: "center" }}>Suhbatni tanlang</h3>
             <p style={{ textAlign: "center" }}>Xabarlarni ko'rish uchun chap tomondan suhbatdoshni tanlang</p>
          </div>
        )}
      </div>
      <style>{`
        .chat-shell {
          display: grid;
          grid-template-columns: 300px 1fr;
          height: calc(100vh - 200px);
          min-height: 560px;
          background: var(--card-bg);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--gray-100);
        }
        .chat-sidebar {
          border-right: 1px solid var(--gray-100);
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .chat-main {
          display: flex;
          flex-direction: column;
          background: var(--gray-50);
          min-width: 0;
        }
        .chat-back-btn {
          display: none;
          border: 1px solid var(--gray-200);
          background: var(--card-bg);
          color: var(--gray-700);
          border-radius: 10px;
          padding: 0.35rem 0.6rem;
          font-size: 0.78rem;
          font-weight: 700;
          margin-right: 0.25rem;
        }
        [data-theme="dark"] .chat-shell {
          border-color: #1f2937;
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.35);
        }
        [data-theme="dark"] .chat-sidebar {
          border-right-color: #1f2937;
          background: #0b1220;
        }
        [data-theme="dark"] .chat-main {
          background: #0f172a;
        }
        [data-theme="dark"] .chat-back-btn {
          border-color: #334155;
          color: #e2e8f0;
        }
        @media (max-width: 900px) {
          .chat-shell {
            grid-template-columns: 1fr;
            height: calc(100vh - 160px);
            min-height: 520px;
          }
          .chat-sidebar {
            border-right: none;
            border-bottom: 1px solid var(--gray-100);
            display: none;
          }
          .chat-sidebar.mobile-open {
            display: flex;
          }
          .chat-main.mobile-hidden {
            display: none;
          }
          .chat-back-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
