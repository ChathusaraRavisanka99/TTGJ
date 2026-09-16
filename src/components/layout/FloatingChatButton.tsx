"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { pollMyConversations, type ConversationView } from "@/actions/chat";
import { cn } from "@/lib/utils";

// Same "plain polling" convention as ChatPanel/NotificationBell — see
// NotificationBell's own comment for why this trades some immediacy for
// far less background traffic than a per-request panel's 3s poll.
const POLL_INTERVAL_MS = 20000;

function requestHref(c: Pick<ConversationView, "requestType" | "requestId">): string {
  return c.requestType === "quote" ? `/account/quotes/${c.requestId}` : `/account/sourcing/${c.requestId}`;
}

function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

/** Bottom-right floating entry point into the customer's existing quote/
 * sourcing chats — signed-in only, since chat is still tied to a request
 * rather than a general "ask us anything" widget (that option was
 * deliberately turned down — see NotificationBell's sibling feature, the
 * admin messages inbox, for the equivalent on the admin side). With
 * exactly one conversation this skips the popup and jumps straight there;
 * with several it lists them so the customer picks which to open. */
export function FloatingChatButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ConversationView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const result = await pollMyConversations();
      if (cancelled) return;
      setItems(result.items);
      setUnreadCount(result.unreadCount);
      setLoaded(true);
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

  function handleClick() {
    // Not loaded yet (first poll still in flight) — just open the popup,
    // which shows its own loading-appropriate empty state rather than
    // guessing at a single-conversation redirect from stale/empty data.
    if (loaded && items.length === 1) {
      router.push(requestHref(items[0]));
      return;
    }
    setOpen((v) => !v);
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="absolute bottom-16 right-0 w-80 max-w-[85vw] rounded-xl border border-border-subtle bg-surface p-2 text-left shadow-lg">
          <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-charcoal/50">Your Conversations</p>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-charcoal/50">
                No conversations yet — a chat opens once you submit a{" "}
                <Link href="/sourcing" onClick={() => setOpen(false)} className="text-gold underline">
                  sourcing request
                </Link>{" "}
                or request a quote on a gemstone/jewelry piece.
              </p>
            )}
            {items.map((c) => (
              <Link
                key={`${c.requestType}-${c.requestId}`}
                href={requestHref(c)}
                onClick={() => setOpen(false)}
                className={cn("block rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-ivory-soft", c.unreadCount > 0 && "bg-gold/10")}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-charcoal">{c.itemLabel}</p>
                  {c.unreadCount > 0 && (
                    <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-charcoal">
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </div>
                {c.lastMessagePreview && <p className="truncate text-xs text-charcoal/60">{c.lastMessagePreview}</p>}
                <p className="mt-0.5 text-xs text-charcoal/45">{timeAgo(c.lastMessageAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        aria-label="Your conversations"
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5",
          // Glass bubble: a translucent tint (not a solid fill) plus
          // backdrop-blur is what actually reads as "glass" — a border
          // alone on a transparent background just looks unstyled. The
          // charcoal tint (rather than white) is what keeps the white
          // icon/badge legible over both this site's light pages and its
          // dark home/collection heroes, since backdrop-blur alone doesn't
          // add contrast, it only blurs whatever's already behind it.
          "border border-white/30 bg-charcoal/35 hover:bg-charcoal/50",
        )}
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-medium text-charcoal">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
