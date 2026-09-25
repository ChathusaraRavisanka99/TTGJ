import type { Metadata } from "next";
import Link from "@/components/ui/MarketLink";
import { CreditCard, MessageCircle, Package, ShoppingBag } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMarket } from "@/lib/market";
import { getConversationsForCustomer, getGeneralThreadInfo } from "@/lib/chat";
import { DESIGN_QUOTE_WHERE, buildConversationRows, designKind, designLabel, getHubCounts } from "@/lib/account-hub";
import { QuoteStatusBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { OrderCard, orderCardInclude } from "@/components/account/OrderCard";
import { ConversationRow } from "@/components/account/ConversationRow";
import { SectionCard, EmptyNote } from "@/components/account/SectionCard";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountOverviewPage() {
  const session = await auth();
  if (!session?.user) return null; // proxy.ts guards this route

  const userId = session.user.id;
  const market = await getMarket();
  const [counts, user, recentOrders, conversations, general, sourcing, designs] = await Promise.all([
    getHubCounts(userId, market),
    // Not embedded in the session/JWT (only role is) — cheap enough to read
    // fresh here rather than plumb it through auth.ts for one banner.
    prisma.user.findUnique({ where: { id: userId }, select: { wholesaleStatus: true } }),
    prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 2, include: orderCardInclude }),
    getConversationsForCustomer(userId),
    getGeneralThreadInfo(userId),
    prisma.sourcingRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.quoteRequest.findMany({ where: { userId, ...DESIGN_QUOTE_WHERE }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  const conversationRows = buildConversationRows(conversations, general).slice(0, 4);
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  const tiles = [
    { href: "/account/orders?status=pending", label: "Awaiting payment", value: counts.ordersAwaitingPayment, icon: CreditCard, attention: counts.ordersAwaitingPayment > 0 },
    { href: "/account/orders?status=paid", label: "Paid orders", value: counts.ordersPaid, icon: Package, attention: false },
    { href: "/account/messages", label: "Unread messages", value: counts.unreadMessages, icon: MessageCircle, attention: counts.unreadMessages > 0 },
    { href: "/account/retail-cart", label: "In your cart", value: counts.cartItems, icon: ShoppingBag, attention: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold-deep">Account</p>
        <h1 className="mt-2 font-serif text-3xl text-charcoal sm:text-4xl">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-charcoal/60">Everything you&apos;ve ordered, asked, and designed with Ratnavue, in one place.</p>
      </div>

      {user?.wholesaleStatus === "PENDING" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your wholesale account application is being reviewed. You can browse the catalog, request quotes, and buy retail while you wait.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map(({ href, label, value, icon: Icon, attention }) => (
          <Link
            key={label}
            href={href}
            className={`rounded-xl border bg-surface p-4 transition-colors hover:border-gold sm:p-5 ${attention ? "border-gold/60" : "border-border-subtle"}`}
          >
            <span className="flex items-center justify-between">
              <span className="font-serif text-3xl text-charcoal">{value}</span>
              <Icon size={18} className={attention ? "text-gold-deep" : "text-charcoal/35"} />
            </span>
            <span className="mt-1 block text-sm text-charcoal/65">{label}</span>
          </Link>
        ))}
      </div>

      <SectionCard title="Recent Orders" href="/account/orders">
        {recentOrders.length === 0 ? (
          <EmptyNote>
            No orders yet.{" "}
            <Link href="/gems" className="text-gold-deep underline">Browse gemstones</Link> or{" "}
            <Link href="/jewelry" className="text-gold-deep underline">jewelry</Link>.
          </EmptyNote>
        ) : (
          <div className="space-y-4 p-4">
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} compact />
            ))}
          </div>
        )}
      </SectionCard>

      {/* minmax(0,1fr): without it a grid column grows to fit its widest unwrapped
          text (a message preview) and pushes the whole page wider than a phone. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <SectionCard title="Messages" href="/account/messages">
          <div>
            {conversationRows.map((row) => (
              <ConversationRow key={row.key} item={row} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Sourcing Requests" href="/account/sourcing">
          {sourcing.length === 0 ? (
            <EmptyNote>
              Looking for a specific stone? <Link href="/sourcing" className="text-gold-deep underline">Tell us what you need</Link>.
            </EmptyNote>
          ) : (
            sourcing.map((r) => (
              <Link
                key={r.id}
                href={`/account/sourcing/${r.id}`}
                className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3 last:border-0 hover:bg-ivory-soft"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-charcoal">{r.mineralDescription}</span>
                  <span className="text-xs text-charcoal/65">{r.createdAt.toLocaleDateString()}</span>
                </span>
                <QuoteStatusBadge status={r.status} />
              </Link>
            ))
          )}
        </SectionCard>

        <SectionCard title="Custom Designs" href="/account/custom-designs">
          {designs.length === 0 ? (
            <EmptyNote>
              Design your own gem in the <Link href="/configurator" className="text-gold-deep underline">configurator</Link> and request a quote.
            </EmptyNote>
          ) : (
            designs.map((d) => (
              <Link
                key={d.id}
                href={`/account/quotes/${d.id}`}
                className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3 last:border-0 hover:bg-ivory-soft"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-charcoal">{designLabel(d)}</span>
                  <span className="text-xs text-charcoal/65">{designKind(d)} · {d.createdAt.toLocaleDateString()}</span>
                </span>
                <QuoteStatusBadge status={d.status} />
              </Link>
            ))
          )}
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="flex flex-wrap gap-3 p-5">
            <LinkButton href="/gems" variant="primary" size="sm">Shop gemstones</LinkButton>
            <LinkButton href="/jewelry" variant="outline" size="sm">Shop jewelry</LinkButton>
            <LinkButton href="/configurator" variant="outline" size="sm">Design a gem</LinkButton>
            <LinkButton href="/sourcing" variant="outline" size="sm">Request sourcing</LinkButton>
            <LinkButton href="/account/messages?type=general" variant="outline" size="sm">Chat with support</LinkButton>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
