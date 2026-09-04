"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gem, Paperclip, X } from "lucide-react";
import { sendChatMessage, markChatRead, pollChatMessages, getChatTagOptions, type ChatMessageView } from "@/actions/chat";
import type { ChatRequestType } from "@/lib/chat";
import { Textarea, Select, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn, formatPrice } from "@/lib/utils";

const POLL_INTERVAL_MS = 3000;

interface TagOption {
  id: string;
  name: string;
}

export function ChatPanel({
  requestType,
  requestId,
  currentUserId,
  initialMessages,
  hasOpenCart,
}: {
  requestType: ChatRequestType;
  requestId: string;
  currentUserId: string;
  initialMessages: ChatMessageView[];
  /** Whether the request's customer currently has an open cart with
   * items — the "tag cart" option only makes sense to offer when
   * there's actually something to attach. */
  hasOpenCart: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [tagType, setTagType] = useState<"none" | "gemstone" | "jewelry" | "cart">("none");
  const [tagId, setTagId] = useState("");
  const [gemstones, setGemstones] = useState<TagOption[]>([]);
  const [jewelry, setJewelry] = useState<TagOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Mark read on open, and again shortly after — covers a message that
  // arrives via polling right as this mounts, so it doesn't linger
  // "unread" the instant it's actually been seen.
  useEffect(() => {
    markChatRead(requestType, requestId);
    const t = setTimeout(() => markChatRead(requestType, requestId), POLL_INTERVAL_MS + 500);
    return () => clearTimeout(t);
  }, [requestType, requestId]);

  // Polling stands in for a live push — see the schema comment on
  // ChatThread for why: real push here would mean bridging this app's
  // NextAuth sessions into Supabase Realtime's RLS-based channel
  // authorization, effectively running a second auth system just for
  // this. A few seconds' delay reads as "live" for a support chat like
  // this without that cost.
  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await pollChatMessages(requestType, requestId);
      if (fresh.length !== messagesRef.current.length) {
        setMessages(fresh);
        markChatRead(requestType, requestId);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [requestType, requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if ((tagType === "gemstone" || tagType === "jewelry") && gemstones.length === 0 && jewelry.length === 0) {
      getChatTagOptions().then((opts) => {
        setGemstones(opts.gemstones);
        setJewelry(opts.jewelry);
      });
    }
  }, [tagType, gemstones.length, jewelry.length]);

  const canSend = pending
    ? false
    : body.trim().length > 0
      ? true
      : tagType === "cart"
        ? true
        : (tagType === "gemstone" || tagType === "jewelry") && !!tagId;

  function handleSend() {
    if (!canSend) return;
    setError(null);
    const tag: Parameters<typeof sendChatMessage>[0]["tag"] =
      tagType === "cart" ? { type: "cart" } : tagType === "none" ? undefined : { type: tagType, id: tagId };
    startTransition(async () => {
      const result = await sendChatMessage({ requestType, requestId, body: body.trim(), tag });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
      setTagType("none");
      setTagId("");
      const fresh = await pollChatMessages(requestType, requestId);
      setMessages(fresh);
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="font-serif text-lg text-charcoal">Messages</p>

      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && <p className="text-sm text-charcoal/50">No messages yet — say hello.</p>}
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} isMine={m.senderId === currentUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 space-y-2 border-t border-border-subtle pt-4">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message..."
          className="min-h-16"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={tagType}
              onChange={(e) => {
                setTagType(e.target.value as typeof tagType);
                setTagId("");
              }}
              className="w-auto py-1.5 text-xs"
            >
              <option value="none">No attachment</option>
              <option value="gemstone">Tag a gemstone</option>
              <option value="jewelry">Tag a jewelry piece</option>
              {hasOpenCart && <option value="cart">Tag the cart</option>}
            </Select>
            {(tagType === "gemstone" || tagType === "jewelry") && (
              <Select value={tagId} onChange={(e) => setTagId(e.target.value)} className="w-48 py-1.5 text-xs">
                <option value="">Select...</option>
                {(tagType === "gemstone" ? gemstones : jewelry).map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Select>
            )}
            {tagType === "cart" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs text-charcoal/70">
                <Paperclip size={11} /> Cart contents
                <button type="button" onClick={() => setTagType("none")} className="ml-0.5 text-charcoal/40 hover:text-charcoal">
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
          <Button type="button" variant="gold" size="sm" disabled={!canSend} onClick={handleSend}>
            {pending ? "Sending..." : "Send"}
          </Button>
        </div>
        <FieldError>{error ?? undefined}</FieldError>
      </div>
    </div>
  );
}

function ChatBubble({ message, isMine }: { message: ChatMessageView; isMine: boolean }) {
  const time = new Date(message.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm", isMine ? "bg-gold/15" : "bg-ivory-soft")}>
        <p className="text-[10px] uppercase tracking-wide text-charcoal/40">
          {isMine ? "You" : message.senderName} · {time}
        </p>
        {message.body && <p className="mt-1 whitespace-pre-wrap text-charcoal">{message.body}</p>}
        {message.taggedGemstone && <TaggedItemCard href={`/gems/${message.taggedGemstone.slug}`} item={message.taggedGemstone} />}
        {message.taggedJewelry && <TaggedItemCard href={`/jewelry/${message.taggedJewelry.slug}`} item={message.taggedJewelry} />}
        {message.taggedCartSnapshot && <TaggedCartCard snapshot={message.taggedCartSnapshot} />}
      </div>
    </div>
  );
}

function TaggedItemCard({ href, item }: { href: string; item: { name: string; price: number | null; showPrice: boolean; imageUrl?: string } }) {
  return (
    <Link href={href} target="_blank" className="mt-2 flex items-center gap-3 rounded-lg border border-border-subtle bg-surface p-2 hover:border-gold/40">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-ivory-soft">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-charcoal/25"><Gem size={18} strokeWidth={1} /></div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-charcoal">{item.name}</p>
        {item.showPrice && item.price != null && <p className="text-xs text-charcoal/50">{formatPrice(item.price)}</p>}
      </div>
    </Link>
  );
}

function TaggedCartCard({ snapshot }: { snapshot: { items: { label: string; amount: number }[]; total: number } }) {
  return (
    <div className="mt-2 rounded-lg border border-border-subtle bg-surface p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-charcoal/45">Cart at the time</p>
      <div className="mt-1.5 space-y-1">
        {snapshot.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-xs text-charcoal/70">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0">{formatPrice(item.amount)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-border-subtle pt-1.5 text-xs font-medium text-charcoal">
        <span>Total</span>
        <span>{formatPrice(snapshot.total)}</span>
      </div>
    </div>
  );
}
