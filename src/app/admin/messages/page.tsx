import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUnreadCount } from "@/lib/chat";
import { QuoteStatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { BackLink } from "@/components/admin/BackLink";
import { cn } from "@/lib/utils";
import type { ConfiguredSpec } from "@/lib/validation/quote";

const PAGE_SIZE = 20;

interface InboxRow {
  requestType: "quote" | "sourcing";
  requestId: string;
  itemLabel: string;
  customerName: string;
  customerEmail: string;
  status: string;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  unread: number;
}

function quoteItemLabel(q: {
  gemstone: { name: string } | null;
  jewelry: { name: string } | null;
  configuredSpec: unknown;
  productType: string | null;
}): string {
  if (q.gemstone) return q.gemstone.name;
  if (q.jewelry) return q.jewelry.name;
  const spec = q.configuredSpec as ConfiguredSpec | null;
  if (spec?.mineralName) return `Configured ${spec.mineralName}`;
  return q.productType === "CUSTOM" ? "Custom Design" : "Item";
}

/** A unified view across both request types' chat threads — the two admin
 * list pages (/admin/quotes, /admin/sourcing) already show a per-row
 * unread badge, but there was nowhere to see every active conversation
 * across both at once, sorted by what actually needs a reply, or search
 * across them by customer. Small dataset (same order of magnitude as the
 * quotes/sourcing tables themselves), so this fetches both in full and
 * sorts/searches/paginates in memory — the same "fetch all, scan"
 * reasoning already used for other small tables in this codebase (see
 * e.g. resolveCollectionKeyBySlug), rather than a hand-rolled cross-table
 * SQL union. */
export default async function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const sort = sp.sort === "unread" ? "unread" : "recent";
  const page = Math.max(1, Number(sp.page) || 1);

  const [quotes, sourcing] = await Promise.all([
    prisma.quoteRequest.findMany({
      include: {
        user: { select: { name: true, email: true } },
        gemstone: { select: { name: true } },
        jewelry: { select: { name: true } },
        chatThread: { include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } },
      },
    }),
    prisma.sourcingRequest.findMany({
      include: {
        user: { select: { name: true, email: true } },
        chatThread: { include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } },
      },
    }),
  ]);

  let rows: InboxRow[] = [
    ...quotes
      .filter((r) => r.chatThread)
      .map((r) => ({
        requestType: "quote" as const,
        requestId: r.id,
        itemLabel: quoteItemLabel(r),
        customerName: r.user.name ?? r.user.email,
        customerEmail: r.user.email,
        status: r.status,
        lastMessageAt: r.chatThread!.messages[0]?.createdAt ?? r.chatThread!.createdAt,
        lastMessagePreview: r.chatThread!.messages[0]?.body ?? null,
        unread: 0,
      })),
    ...sourcing
      .filter((r) => r.chatThread)
      .map((r) => ({
        requestType: "sourcing" as const,
        requestId: r.id,
        itemLabel: r.mineralDescription,
        customerName: r.user.name ?? r.user.email,
        customerEmail: r.user.email,
        status: r.status,
        lastMessageAt: r.chatThread!.messages[0]?.createdAt ?? r.chatThread!.createdAt,
        lastMessagePreview: r.chatThread!.messages[0]?.body ?? null,
        unread: 0,
      })),
  ];

  const unreadCounts = await Promise.all(rows.map((r) => getUnreadCount(r.requestType, r.requestId, "ADMIN")));
  rows = rows.map((r, i) => ({ ...r, unread: unreadCounts[i] }));

  if (q) {
    rows = rows.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.customerEmail.toLowerCase().includes(q) ||
        r.itemLabel.toLowerCase().includes(q) ||
        (r.lastMessagePreview?.toLowerCase().includes(q) ?? false),
    );
  }

  rows.sort((a, b) => {
    if (sort === "unread" && a.unread !== b.unread) return b.unread - a.unread;
    return (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0);
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalUnread = rows.reduce((sum, r) => sum + r.unread, 0);

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-charcoal">Messages</h1>
        {totalUnread > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-medium text-charcoal">
            <MessageCircle size={12} /> {totalUnread} unread
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-charcoal/60">Every quote and sourcing request with an active conversation, in one place.</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <form action="/admin/messages" method="get" className="flex items-center gap-2">
          {sort === "unread" && <input type="hidden" name="sort" value="unread" />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by customer, item, or message..."
            className="w-64 rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <button type="submit" className="rounded-full border border-border-subtle px-4 py-2 text-sm text-charcoal/70 hover:border-charcoal/40">
            Search
          </button>
        </form>

        <div className="flex gap-2">
          <Link
            href={q ? `/admin/messages?q=${encodeURIComponent(q)}` : "/admin/messages"}
            className={cn("rounded-full border px-3 py-1.5 text-xs", sort !== "unread" ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}
          >
            Most Recent
          </Link>
          <Link
            href={`/admin/messages?sort=unread${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={cn("rounded-full border px-3 py-1.5 text-xs", sort === "unread" ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}
          >
            Unread First
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Last Message</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={`${r.requestType}-${r.requestId}`} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3">
                  <Link
                    href={r.requestType === "quote" ? `/admin/quotes/${r.requestId}` : `/admin/sourcing/${r.requestId}`}
                    className="flex items-center gap-2 text-charcoal hover:text-gold"
                  >
                    {r.customerName}
                    {r.unread > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-medium text-charcoal">
                        <MessageCircle size={10} /> {r.unread}
                      </span>
                    )}
                  </Link>
                  <p className="text-xs text-charcoal/45">{r.customerEmail}</p>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{r.requestType === "quote" ? "Quote" : "Sourcing"}</td>
                <td className="px-4 py-3 text-charcoal/70">{r.itemLabel}</td>
                <td className="px-4 py-3 text-charcoal/70">
                  {r.lastMessagePreview ? (
                    <>
                      <p className="max-w-xs truncate">{r.lastMessagePreview}</p>
                      <p className="text-xs text-charcoal/45">{r.lastMessageAt?.toLocaleString()}</p>
                    </>
                  ) : (
                    <span className="text-charcoal/40">Attachment only</span>
                  )}
                </td>
                <td className="px-4 py-3"><QuoteStatusBadge status={r.status} /></td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">No conversations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
