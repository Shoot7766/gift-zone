import ChatInterface from "@/components/Chat/ChatInterface";

export default function ProviderChatPage() {
  return (
    <div>
      <h1 style={{ fontWeight: "900", marginBottom: "2rem" }}>Mijozlar bilan suhbat</h1>
      <ChatInterface type="provider" />
    </div>
  );
}
