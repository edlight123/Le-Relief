"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  message: string;
  articleId?: string;
  articleTitle?: string;
  actorName?: string;
  readAt?: string | null;
  createdAt?: string;
}

function typeIcon(type: string): string {
  if (type === "article_approved") return "✅";
  if (type === "revision_requested") return "🔁";
  if (type === "article_rejected") return "❌";
  if (type === "article_submitted") return "📨";
  if (type === "article_published") return "🚀";
  if (type === "comment_added") return "💬";
  return "🔔";
}

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications").then((r) => r.json());
    setNotifications(res.notifications || []);
    setUnreadCount(res.unreadCount || 0);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
    );
    setUnreadCount(0);
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-label text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 border border-border-subtle bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
            <span className="font-label text-xs font-extrabold uppercase tracking-wide text-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 font-label text-[10px] font-bold text-muted hover:text-foreground"
              >
                <CheckCheck className="h-3 w-3" />
                Tout marquer lu
              </button>
            )}
          </div>

          <ul className="max-h-96 divide-y divide-border-subtle overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 h-6 w-6 text-muted" />
                <p className="font-label text-xs text-muted">Aucune notification</p>
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                    !n.readAt ? "bg-primary/[0.04]" : ""
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-sm">{typeIcon(n.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-xs text-foreground leading-snug">{n.message}</p>
                    {n.createdAt && (
                      <p className="mt-0.5 font-label text-[10px] text-muted">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          locale: fr,
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>
                  {!n.readAt && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="shrink-0 text-muted hover:text-foreground"
                      aria-label="Marquer comme lu"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
