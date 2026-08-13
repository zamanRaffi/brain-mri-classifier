import { ChatSocketProvider } from "@/components/chat/chat-socket-provider";

export default function DoctorChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatSocketProvider>{children}</ChatSocketProvider>;
}
