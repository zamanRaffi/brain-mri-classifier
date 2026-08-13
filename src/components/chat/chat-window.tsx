"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatSocket } from "./chat-socket-provider";
import type { ChatMessagePayload } from "@/types/chat-socket";

const TYPING_STOP_DELAY = 1500; // ms of inactivity before we tell the other side we stopped typing
const TYPING_INDICATOR_TIMEOUT = 3000; // auto-clear "typing…" if a stop event never arrives

export default function ChatWindow({
  currentUserId,
  otherUserId,
  otherUserName,
  conversationStarters,
}: {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  /** Optional clickable prompt suggestions shown before the first message is sent. */
  conversationStarters?: string[];
}) {
  const { socket, isOnline } = useChatSocket();

  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const belongsToThread = useCallback(
    (m: ChatMessagePayload) =>
      (m.senderId === currentUserId && m.receiverId === otherUserId) ||
      (m.senderId === otherUserId && m.receiverId === currentUserId),
    [currentUserId, otherUserId]
  );

  // Load history + mark incoming messages as read whenever the thread changes.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset when switching threads
    setLoading(true);
    setOtherTyping(false);

    async function loadMessages() {
      const res = await fetch(`/api/chat?with=${otherUserId}`);
      if (res.ok && !cancelled) {
        const data = await res.json();
        setMessages(data.messages);
      }
      if (!cancelled) setLoading(false);
    }

    loadMessages();
    socket.emit("chat:read", { otherUserId });
    setMessages((prev) =>
      prev.map((m) =>
        m.senderId === otherUserId && m.receiverId === currentUserId
          ? { ...m, read: true }
          : m
      )
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId]);

  // Real-time listeners for this thread.
  useEffect(() => {
    function handleMessage(message: ChatMessagePayload) {
      if (!belongsToThread(message)) return;
      setMessages((prev) => [...prev, message]);

      // We're actively looking at this thread, so immediately mark as read.
      if (message.senderId === otherUserId) {
        socket.emit("chat:read", { otherUserId });
      }
    }

    function handleTyping(payload: { senderId: string; isTyping: boolean }) {
      if (payload.senderId !== otherUserId) return;
      setOtherTyping(payload.isTyping);
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
      if (payload.isTyping) {
        typingClearTimer.current = setTimeout(
          () => setOtherTyping(false),
          TYPING_INDICATOR_TIMEOUT
        );
      }
    }

    function handleRead(payload: { readerId: string; otherUserId: string }) {
      if (payload.readerId !== otherUserId || payload.otherUserId !== currentUserId)
        return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === currentUserId && m.receiverId === otherUserId
            ? { ...m, read: true }
            : m
        )
      );
    }

    socket.on("chat:message", handleMessage);
    socket.on("chat:typing", handleTyping);
    socket.on("chat:read", handleRead);

    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:typing", handleTyping);
      socket.off("chat:read", handleRead);
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
    };
  }, [socket, otherUserId, currentUserId, belongsToThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  function stopTyping() {
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("chat:typing", { receiverId: otherUserId, isTyping: false });
    }
  }

  function handleInputChange(value: string) {
    setInput(value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("chat:typing", { receiverId: otherUserId, isTyping: true });
    }

    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(stopTyping, TYPING_STOP_DELAY);
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput("");
    submitContent(content);
  }

  function submitContent(content: string) {
    stopTyping();
    setSendError(null);

    socket.emit("chat:send", { receiverId: otherUserId, content }, (message) => {
      if (!message) {
        setSendError("Failed to send message. Please try again.");
      }
      // On success the message itself arrives via the "chat:message" event
      // (the sender is also joined to their own room), so we don't need to
      // append it here — that keeps every open tab in sync the same way.
    });
  }

  function sendStarter(text: string) {
    submitContent(text);
  }

  const online = isOnline(otherUserId);

  return (
    <div className="flex-1 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,74,198,0.05)] border border-outline-variant/30 flex flex-col overflow-hidden h-[560px]">
      {/* Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-outline-variant/20 shrink-0">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold text-sm">
            {otherUserName.charAt(0).toUpperCase()}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-container-lowest ${
              online ? "bg-tertiary" : "bg-outline"
            }`}
            aria-hidden
          />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-on-surface truncate">
            {otherUserName}
          </h2>
          <p className="text-xs text-on-surface-variant truncate">
            {otherTyping ? (
              <span className="text-primary font-medium">Typing…</span>
            ) : online ? (
              "Online"
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {!loading && messages.length === 0 && (
          <div className="m-auto flex flex-col items-center gap-4 max-w-sm text-center">
            <p className="text-sm text-on-surface-variant">
              No messages yet. Start the conversation!
            </p>
            {conversationStarters && conversationStarters.length > 0 && (
              <div className="flex flex-col gap-2 w-full">
                {conversationStarters.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => sendStarter(starter)}
                    className="text-left text-sm px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-primary/5 hover:border-primary/40 text-on-surface transition-colors"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m) => {
          const isMine = m.senderId === currentUserId;
          return (
            <div
              key={m.id}
              className={`max-w-[75%] flex flex-col ${
                isMine ? "self-end items-end" : "self-start items-start"
              }`}
            >
              <div
                className={`px-4 py-2.5 text-sm ${
                  isMine
                    ? "bg-primary text-on-primary rounded-2xl rounded-br-none shadow-sm"
                    : "bg-surface-container-lowest text-on-surface border border-outline-variant/20 rounded-2xl rounded-bl-none shadow-sm"
                }`}
              >
                {m.content}
              </div>
              <span className="flex items-center gap-1 text-[10px] text-on-surface-variant mt-1 px-1">
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {isMine && (
                  <span
                    className={m.read ? "text-primary" : "text-on-surface-variant"}
                    aria-label={m.read ? "Read" : "Sent"}
                  >
                    {m.read ? "✓✓" : "✓"}
                  </span>
                )}
              </span>
            </div>
          );
        })}
        {otherTyping && (
          <div className="self-start flex items-center gap-1 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl rounded-bl-none shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="border-t border-outline-variant/20 p-3 flex flex-col gap-1.5 shrink-0"
      >
        {sendError && (
          <p className="text-xs text-error px-1">{sendError}</p>
        )}
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={stopTyping}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 min-h-[44px] max-h-32 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all resize-none py-2.5 px-4 text-sm"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="w-11 h-11 bg-primary text-on-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shrink-0 shadow-sm"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              send
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
