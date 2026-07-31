"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  type: "message" | "appointment" | "prediction";
  title: string;
  description: string;
  href: string;
  createdAt: string;
  unread: boolean;
};

const ICON_BY_TYPE: Record<NotificationItem["type"], string> = {
  message: "forum",
  appointment: "event",
  prediction: "neurology",
};

function lastSeenKey(userId: string) {
  return `notifications:lastSeen:${userId}`;
}

function getLastSeen(userId: string): string {
  if (typeof window === "undefined") return new Date(0).toISOString();
  return window.localStorage.getItem(lastSeenKey(userId)) ?? new Date(0).toISOString();
}

function setLastSeen(userId: string, iso: string) {
  window.localStorage.setItem(lastSeenKey(userId), iso);
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const since = getLastSeen(userId);
    const res = await fetch(`/api/notifications?since=${encodeURIComponent(since)}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    }
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 15000); // simple polling
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial fetch on mount
    fetchNotifications();
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleToggle() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      setLoading(true);
     
      await Promise.all([
        fetch("/api/notifications", { method: "PATCH" }),
        fetchNotifications(),
      ]);
      setLastSeen(userId, new Date().toISOString());
      setUnreadCount(0);
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors relative"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-error rounded-full flex items-center justify-center text-[10px] font-medium text-on-error leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
            <h3 className="font-semibold text-on-surface text-sm">Notifications</h3>
            {loading && (
              <span className="text-xs text-on-surface-variant">Loading…</span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl text-outline">
                  notifications_off
                </span>
                <p className="text-sm">No new notifications.</p>
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 text-sm border-b border-outline-variant/10 last:border-b-0 hover:bg-surface-container-low transition-colors ${
                    item.unread ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {ICON_BY_TYPE[item.type]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-on-surface truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {item.description}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  {item.unread && (
                    <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
