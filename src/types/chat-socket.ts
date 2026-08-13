// Shared Socket.IO event contracts for real-time chat.
// Imported by both the browser client and the custom Node server, so this
// file must stay free of any server-only or browser-only imports.

export type ChatMessagePayload = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string; // ISO string over the wire
  read: boolean;
};

export type TypingPayload = {
  senderId: string;
  isTyping: boolean;
};

export type ReadReceiptPayload = {
  /** The user who just read the messages. */
  readerId: string;
  /** The other participant in the conversation (whose messages got read). */
  otherUserId: string;
};

export interface ServerToClientEvents {
  /** Sent once, right after connecting: the full list of currently online user ids. */
  "presence:list": (onlineUserIds: string[]) => void;
  "presence:online": (userId: string) => void;
  "presence:offline": (userId: string) => void;
  "chat:message": (message: ChatMessagePayload) => void;
  "chat:typing": (payload: TypingPayload) => void;
  "chat:read": (payload: ReadReceiptPayload) => void;
  "chat:error": (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  "chat:send": (
    payload: { receiverId: string; content: string },
    ack?: (message: ChatMessagePayload | null) => void
  ) => void;
  "chat:typing": (payload: { receiverId: string; isTyping: boolean }) => void;
  "chat:read": (payload: { otherUserId: string }) => void;
}

// No cross-instance events needed for a single-process server.
export type InterServerEvents = Record<string, never>;

export interface SocketData {
  userId: string;
}
