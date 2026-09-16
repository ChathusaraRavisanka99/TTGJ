"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { pollNotifications, markAllNotificationsRead, type NotificationView } from "@/actions/notifications";
import { cn } from "@/lib/utils";

// Same "plain polling, not push" reasoning as ChatPanel — see its own
// comment — but slower: this runs on every page for a signed-in customer
// (not just while a specific request's chat is open), so it trades some
// immediacy for a lot less background traffic site-wide.
const POLL_INTERVAL_MS = 20000;

function requestHref(n: NotificationView): string {
  if (n.requestType === "quote") return `/account/quotes/${n.requestId}`;
  if (n.requestType === "sourcing") return `/account/sourcing/${n.requestId}`;
  return "/account/support";
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

/** Signed-in-only bell in the main Navbar — polls for the customer's own
 * notifications (an admin chat reply, or a status change on their quote/
 * sourcing request; see lib/notifications.ts) and lists them in a
 * dropdown. Visiting the linked request page is what actually marks its
 * notifications read (see markNotificationsReadForRequest in the account
 * detail pages) — "Mark all read" here is just a shortcut for clearing
 * the badge without visiting each one. */
export function NotificationBell({ transparent }: { transparent: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const result = await pollNotifications();
      if (cancelled) return;
      setItems(result.items);
      setUnreadCount(result.unreadCount);
    }
    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleMarkAll() {
    setUnreadCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    await markAllNotificationsRead();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className={cn("relative transition-colors duration-300", transparent ? "text-ivory/85 hover:text-ivory" : "text-charcoal/80 hover:text-charcoal")}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-charcoal">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-80 max-w-[85vw] rounded-xl border border-border-subtle bg-surface p-2 text-left shadow-lg">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAll} className="text-xs text-gold hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="px-2 py-6 text-center text-sm text-charcoal/50">No notifications yet.</p>}
            {items.map((n) => (
              <Link
                key={n.id}
                href={requestHref(n)}
                onClick={() => setOpen(false)}
                className={cn("block rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-ivory-soft", !n.readAt && "bg-gold/10")}
              >
                <p className="text-charcoal">{n.message}</p>
                <p className="mt-0.5 text-xs text-charcoal/45">{timeAgo(n.createdAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
