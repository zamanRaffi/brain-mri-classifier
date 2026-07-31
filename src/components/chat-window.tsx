"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

export default function ChatWindow({
  currentUserId,
  otherUserId,
  otherUserName,
}: {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    const res = await fetch(`/api/chat?with=${otherUserId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
  }

  useEffect(() => {
    const interval = setInterval(loadMessages, 4000); // simple polling
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial fetch on mount/user change
    loadMessages();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: otherUserId, content: input }),
    });

    if (res.ok) {
      setInput("");
      loadMessages();
    }
  }

  return (
    <div className="flex-1 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,74,198,0.05)] border border-outline-variant/30 flex flex-col overflow-hidden h-[560px]">
      {/* Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-outline-variant/20 shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold text-sm shrink-0">
          {otherUserName.charAt(0).toUpperCase()}
        </div>
        <h2 className="font-semibold text-on-surface truncate">
          {otherUserName}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-on-surface-variant m-auto">
            No messages yet. Start the conversation!
          </p>
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
              <span className="text-[10px] text-on-surface-variant mt-1 px-1">
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="border-t border-outline-variant/20 p-3 flex items-center gap-2 shrink-0"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
      </form>
    </div>
  );
}
