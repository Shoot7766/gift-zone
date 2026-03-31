import ChatInterface from "@/components/Chat/ChatInterface";

export default function CustomerChatPage() {
  return (
    <div>
      <h1 style={{ fontWeight: "900", marginBottom: "2rem" }}>Suhbatlar</h1>
      <ChatInterface type="customer" />
    </div>
  );
}
