import { ChatSocketProvider } from "@/components/chat/chat-socket-provider";

export default function PatientChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatSocketProvider>{children}</ChatSocketProvider>;
}
