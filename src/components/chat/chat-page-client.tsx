"use client";

import Link from "next/link";
import { EmptyState } from "@/components/dashboard/ui";
import ChatWindow from "./chat-window";
import { useChatSocket } from "./chat-socket-provider";

export type ChatContact = {
  id: string;
  name: string;
  displayName: string; // name as it should be rendered (e.g. "Dr. Alice")
  subtitle?: string;
};

export default function ChatPageClient({
  currentUserId,
  basePath,
  listTitle,
  emptyMessage,
  contacts,
  activeContactId,
  conversationStarters,
}: {
  currentUserId: string;
  basePath: string;
  listTitle: string;
  emptyMessage: string;
  contacts: ChatContact[];
  activeContactId?: string;
  /** Optional clickable prompt suggestions shown before the first message in a thread. */
  conversationStarters?: string[];
}) {
  const { isOnline } = useChatSocket();
  const activeContact =
    contacts.find((c) => c.id === activeContactId) ?? contacts[0];

  return (
    <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
      <aside className="w-full md:w-72 shrink-0 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,74,198,0.05)] border border-outline-variant/30 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-outline-variant/20">
          <h2 className="font-semibold text-on-surface">{listTitle}</h2>
        </div>
        <div className="flex flex-col overflow-y-auto">
          {contacts.map((c) => {
            const isActive = activeContact?.id === c.id;
            const online = isOnline(c.id);
            return (
              <Link
                key={c.id}
                href={`${basePath}?with=${c.id}`}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/5 text-primary font-medium"
                    : "hover:bg-surface-container-low text-on-surface"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold text-xs">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-container-lowest ${
                      online ? "bg-tertiary" : "bg-outline"
                    }`}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate">{c.displayName}</p>
                  {c.subtitle && (
                    <p className="text-xs text-on-surface-variant truncate">
                      {c.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      {activeContact ? (
        <ChatWindow
          currentUserId={currentUserId}
          otherUserId={activeContact.id}
          otherUserName={activeContact.displayName}
          conversationStarters={conversationStarters}
        />
      ) : (
        <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
          <EmptyState icon="forum" message={emptyMessage} />
        </div>
      )}
    </div>
  );
}
