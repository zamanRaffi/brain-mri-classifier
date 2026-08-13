"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSocket, type ChatSocket } from "@/lib/socket-client";

type ChatSocketContextValue = {
  socket: ChatSocket;
  onlineUserIds: Set<string>;
  isOnline: (userId: string) => boolean;
};

const ChatSocketContext = createContext<ChatSocketContextValue | null>(null);

/**
 * Wraps a section of the app (the chat routes) with a single shared
 * Socket.IO connection, so navigating between conversations doesn't open a
 * new connection every time.
 */
export function ChatSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [socket] = useState<ChatSocket>(() => getSocket());
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    function handlePresenceList(ids: string[]) {
      setOnlineUserIds(new Set(ids));
    }
    function handleOnline(userId: string) {
      setOnlineUserIds((prev) => {
        if (prev.has(userId)) return prev;
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    }
    function handleOffline(userId: string) {
      setOnlineUserIds((prev) => {
        if (!prev.has(userId)) return prev;
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }

    socket.on("presence:list", handlePresenceList);
    socket.on("presence:online", handleOnline);
    socket.on("presence:offline", handleOffline);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("presence:list", handlePresenceList);
      socket.off("presence:online", handleOnline);
      socket.off("presence:offline", handleOffline);
      // Intentionally not disconnecting here: this provider lives in a
      // layout, so it only unmounts when the user leaves the chat section
      // entirely — at which point dropping the connection is fine too, but
      // socket.io's own cleanup on page/route unload handles that for us.
    };
  }, [socket]);

  const value = useMemo<ChatSocketContextValue>(
    () => ({
      socket,
      onlineUserIds,
      isOnline: (userId: string) => onlineUserIds.has(userId),
    }),
    [socket, onlineUserIds]
  );

  return (
    <ChatSocketContext.Provider value={value}>
      {children}
    </ChatSocketContext.Provider>
  );
}

export function useChatSocket() {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) {
    throw new Error("useChatSocket must be used within a ChatSocketProvider");
  }
  return ctx;
}
