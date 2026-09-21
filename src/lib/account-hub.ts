import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getConversationsForCustomer, getGeneralThreadInfo, type CustomerConversation, type GeneralThreadInfo } from "@/lib/chat";
import type { Market } from "@/lib/market-shared";
import type { ConfiguredSpec } from "@/lib/validation/quote";

// The account hub splits a customer's quote requests in two, the way a
// marketplace separates "orders" from "custom orders":
//  - Custom designs: a free-form "commission a custom piece" request, or a gem
//    they configured themselves in the configurator.
//  - Quote requests: a request for a quote on an item from the catalog.
// Both are QuoteRequest rows; these filters are the one place that says which
// is which.
export const DESIGN_QUOTE_WHERE: Prisma.QuoteRequestWhereInput = {
  OR: [{ productType: "CUSTOM" }, { configuredSpec: { not: Prisma.DbNull } }],
};
export const CATALOG_QUOTE_WHERE: Prisma.QuoteRequestWhereInput = { NOT: DESIGN_QUOTE_WHERE };

export function designLabel(quote: { productType: string | null; configuredSpec: unknown }): string {
  const spec = quote.configuredSpec as ConfiguredSpec | null;
  if (spec) return `Configured ${spec.mineralName}${spec.cutName ? ` (${spec.cutName})` : ""}`;
  return "Custom Design";
}

export function designKind(quote: { configuredSpec: unknown }): "Configured gem" | "Custom piece" {
  return quote.configuredSpec ? "Configured gem" : "Custom piece";
}

export interface HubCounts {
  /** Unread chat messages across support and every request's thread. */
  unreadMessages: number;
  ordersAwaitingPayment: number;
  ordersPaid: number;
  ordersTotal: number;
  /** Items in this storefront's shopping cart. */
  cartItems: number;
  /** Accepted quotes / sourcing results waiting to be paid (the wholesale cart). */
  quotePayments: number;
  catalogQuotes: number;
  sourcingRequests: number;
  customDesigns: number;
}

/** Everything the sidebar badges and the overview tiles need, in one round trip. */
export async function getHubCounts(userId: string, market: Market): Promise<HubCounts> {
  const [orderGroups, cartItems, quotePayments, catalogQuotes, sourcingRequests, customDesigns, conversations, general] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: { userId }, _count: { _all: true } }),
    prisma.retailCartItem.count({ where: { cart: { userId, market } } }),
    prisma.cartItem.count({ where: { cart: { userId, status: "OPEN" } } }),
    prisma.quoteRequest.count({ where: { userId, ...CATALOG_QUOTE_WHERE } }),
    prisma.sourcingRequest.count({ where: { userId } }),
    prisma.quoteRequest.count({ where: { userId, ...DESIGN_QUOTE_WHERE } }),
    getConversationsForCustomer(userId),
    getGeneralThreadInfo(userId),
  ]);

  const byStatus = (status: string) => orderGroups.find((g) => g.status === status)?._count._all ?? 0;
  return {
    unreadMessages: general.unreadCount + conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    ordersAwaitingPayment: byStatus("PENDING_PAYMENT"),
    ordersPaid: byStatus("PAID"),
    ordersTotal: orderGroups.reduce((sum, g) => sum + g._count._all, 0),
    cartItems,
    quotePayments,
    catalogQuotes,
    sourcingRequests,
    customDesigns,
  };
}

export type ConversationKind = "support" | "quote" | "design" | "sourcing";

export interface ConversationRowData {
  key: string;
  href: string;
  title: string;
  kind: ConversationKind;
  preview: string | null;
  when: Date | null;
  unread: number;
}

/** The conversation list: "Ratnavue Support" is always first (a customer can
 * start it any time), then every quote / design / sourcing thread that has
 * messages, newest first. */
export function buildConversationRows(conversations: CustomerConversation[], general: GeneralThreadInfo): ConversationRowData[] {
  return [
    {
      key: "general",
      href: "/account/messages?type=general",
      title: "Ratnavue Support",
      kind: "support" as const,
      preview: general.lastMessagePreview,
      when: general.lastMessageAt,
      unread: general.unreadCount,
    },
    ...conversations.map((c) => ({
      key: `${c.requestType}:${c.requestId}`,
      href: `/account/messages?type=${c.requestType}&id=${c.requestId}`,
      title: c.itemLabel,
      kind: (c.requestType === "sourcing" ? "sourcing" : c.isDesign ? "design" : "quote") as ConversationKind,
      preview: c.lastMessagePreview,
      when: c.lastMessageAt,
      unread: c.unreadCount,
    })),
  ];
}

/** "3:42 PM" for today, "Sep 21" for anything older — the compact timestamp a
 * conversation list wants. */
export function formatWhen(date: Date): string {
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: date.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}
