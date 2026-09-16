import { prisma } from "@/lib/prisma";
import { cartTotal } from "@/lib/discount-codes";
import type { ConfiguredSpec } from "@/lib/validation/quote";

export type ChatRequestType = "quote" | "sourcing";

export interface ChatContext {
  threadId: string | null;
  customerId: string;
}

/**
 * Resolves which request this thread belongs to and who its customer is,
 * without creating anything — used by both the read path (rendering a
 * possibly-empty thread) and as the ownership check every chat action
 * starts from. Returns null if the request itself doesn't exist.
 */
export async function getChatContext(requestType: ChatRequestType, requestId: string): Promise<ChatContext | null> {
  if (requestType === "quote") {
    const quote = await prisma.quoteRequest.findUnique({ where: { id: requestId }, select: { userId: true, chatThread: { select: { id: true } } } });
    if (!quote) return null;
    return { threadId: quote.chatThread?.id ?? null, customerId: quote.userId };
  }
  const sourcing = await prisma.sourcingRequest.findUnique({ where: { id: requestId }, select: { userId: true, chatThread: { select: { id: true } } } });
  if (!sourcing) return null;
  return { threadId: sourcing.chatThread?.id ?? null, customerId: sourcing.userId };
}

/** Lazily creates the thread on first message — see the schema comment
 * on ChatThread. Idempotent: safe to call even if one already exists. */
export async function getOrCreateChatThread(requestType: ChatRequestType, requestId: string): Promise<string> {
  const existing = await prisma.chatThread.findFirst({
    where: requestType === "quote" ? { quoteRequestId: requestId } : { sourcingRequestId: requestId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.chatThread.create({
    data: requestType === "quote" ? { quoteRequestId: requestId } : { sourcingRequestId: requestId },
  });
  return created.id;
}

export async function getChatMessages(threadId: string | null) {
  if (!threadId) return [];
  return prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { name: true, email: true } },
      taggedGemstone: { select: { name: true, slug: true, price: true, showPrice: true, media: { orderBy: { sortOrder: "asc" }, take: 1 } } },
      taggedJewelry: { select: { name: true, slug: true, price: true, showPrice: true, media: { orderBy: { sortOrder: "asc" }, take: 1 } } },
    },
  });
}

/** Unread count for whichever side is asking — "messages from the other
 * side, created after I last opened this thread." No thread yet means
 * nothing to be unread. */
export async function getUnreadCount(requestType: ChatRequestType, requestId: string, forRole: "CUSTOMER" | "ADMIN"): Promise<number> {
  const thread = await prisma.chatThread.findFirst({
    where: requestType === "quote" ? { quoteRequestId: requestId } : { sourcingRequestId: requestId },
    select: { id: true, lastReadByCustomerAt: true, lastReadByAdminAt: true },
  });
  if (!thread) return 0;

  const since = forRole === "CUSTOMER" ? thread.lastReadByCustomerAt : thread.lastReadByAdminAt;
  return prisma.chatMessage.count({
    where: {
      threadId: thread.id,
      senderRole: { not: forRole },
      createdAt: since ? { gt: since } : undefined,
    },
  });
}

export interface CustomerConversation {
  requestType: ChatRequestType;
  requestId: string;
  itemLabel: string;
  lastMessageAt: Date;
  lastMessagePreview: string | null;
  unreadCount: number;
}

/** Every quote/sourcing request of this customer's that has an actual
 * chat thread — the data behind the floating chat bubble's conversation
 * list (see FloatingChatButton). Same cross-type merge /admin/messages
 * uses, just scoped to one customer instead of the whole business, so
 * "fetch both tables, combine in memory" is even safer here (at most a
 * handful of rows per person). */
export async function getConversationsForCustomer(userId: string): Promise<CustomerConversation[]> {
  const [quotes, sourcing] = await Promise.all([
    prisma.quoteRequest.findMany({
      where: { userId, chatThread: { isNot: null } },
      include: {
        gemstone: { select: { name: true } },
        jewelry: { select: { name: true } },
        chatThread: { include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } },
      },
    }),
    prisma.sourcingRequest.findMany({
      where: { userId, chatThread: { isNot: null } },
      include: { chatThread: { include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } } },
    }),
  ]);

  const rows: CustomerConversation[] = [
    ...quotes.map((q) => {
      const spec = q.configuredSpec as ConfiguredSpec | null;
      const itemLabel = q.gemstone?.name ?? q.jewelry?.name ?? (spec?.mineralName ? `Configured ${spec.mineralName}` : q.productType === "CUSTOM" ? "Custom Design" : "Item");
      return {
        requestType: "quote" as const,
        requestId: q.id,
        itemLabel,
        lastMessageAt: q.chatThread!.messages[0]?.createdAt ?? q.chatThread!.createdAt,
        lastMessagePreview: q.chatThread!.messages[0]?.body ?? null,
        unreadCount: 0,
      };
    }),
    ...sourcing.map((s) => ({
      requestType: "sourcing" as const,
      requestId: s.id,
      itemLabel: s.mineralDescription,
      lastMessageAt: s.chatThread!.messages[0]?.createdAt ?? s.chatThread!.createdAt,
      lastMessagePreview: s.chatThread!.messages[0]?.body ?? null,
      unreadCount: 0,
    })),
  ];

  const unreadCounts = await Promise.all(rows.map((r) => getUnreadCount(r.requestType, r.requestId, "CUSTOMER")));
  rows.forEach((r, i) => {
    r.unreadCount = unreadCounts[i];
  });

  rows.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  return rows;
}

/** A JSON-serializable snapshot of a cart at the moment it's tagged in a
 * message — never a live reference, since by the time the message is
 * read the cart it pointed at may have changed or been submitted
 * entirely. Returns null if the customer has no open cart to snapshot. */
export async function snapshotOpenCart(customerId: string): Promise<{ items: { label: string; amount: number }[]; total: number } | null> {
  const cart = await prisma.cart.findFirst({ where: { userId: customerId, status: "OPEN" }, include: { items: true } });
  if (!cart || cart.items.length === 0) return null;

  return {
    items: cart.items.map((item) => ({ label: item.label, amount: item.amount })),
    total: cartTotal(cart.items, cart.discountAmount),
  };
}
