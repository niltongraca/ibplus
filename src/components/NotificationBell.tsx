"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Info, AlertTriangle, ShoppingCart, Users, Package, TrendingUp } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-blue-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  sale: <ShoppingCart className="w-4 h-4 text-green-500" />,
  customer: <Users className="w-4 h-4 text-purple-500" />,
  stock: <Package className="w-4 h-4 text-red-500" />,
  insight: <TrendingUp className="w-4 h-4 text-cyan-500" />,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5 text-ib-muted" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-ib-danger text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border shadow-lg z-50 max-h-[70vh] flex flex-col" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-color)" }}>
            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Notificações</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-ib-accent hover:text-blue-700">
                <CheckCheck className="w-3.5 h-3.5" /> Marcar todas lidas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-ib-muted text-sm">Nenhuma notificação</div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 border-b transition-colors cursor-pointer"
                  style={{ borderColor: "var(--border-color)", backgroundColor: !n.read ? "rgba(37,99,235,0.05)" : "transparent" }}
                  onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-secondary)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !n.read ? "rgba(37,99,235,0.05)" : "transparent"}
                >
                  <div className="mt-0.5 shrink-0">{typeIcons[n.type] || typeIcons.info}</div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!n.read ? "font-semibold" : ""}`} style={{ color: "var(--text-primary)" }}>{n.title}</p>
                    {n.message && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{n.message}</p>}
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-ib-accent shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
