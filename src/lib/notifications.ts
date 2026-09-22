import { prisma } from "@/lib/prisma";
import type { ChatRequestType } from "@/lib/chat";
import type { NotificationType } from "@prisma/client";

/** Everything ChatRequestType covers (a quote, a sourcing request, or the
 * general support thread), plus "order" — a payment/cancellation update,
 * which has no chat thread of its own but still links back to something the
 * customer owns (see lib/orders.ts and app/api/payhere/notify/route.ts). */
export type NotificationRequestType = ChatRequestType | "order";

/** Fires a customer-facing notification — see the Notification model's own
 * doc comment for why this is a discrete row rather than reusing
 * ChatThread's running "unread since" scheme. Called from sendChatMessage
 * (an admin's reply), updateQuoteRequest/updateSourcingRequest (a status
 * change), and lib/orders.ts / the PayHere webhook (an order paid, failed,
 * or cancelled) — never from the customer's own actions, since they don't
 * need to be notified of their own message/request/cancellation. */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  message: string;
  requestType: NotificationRequestType;
  requestId: string;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message,
      requestType: input.requestType,
      requestId: input.requestId,
    },
  });
}

const RECENT_LIMIT = 20;

/** The bell dropdown's data — the customer's most recent, non-dismissed
 * notifications (read and unread both, so the list doesn't empty out the
 * moment everything's read) plus a separate unread count for the badge. A
 * dismissed notification is excluded from both — gone for good, not just
 * marked read. */
export async function getNotificationsForUser(userId: string) {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, dismissedAt: null },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
    }),
    prisma.notification.count({ where: { userId, readAt: null, dismissedAt: null } }),
  ]);
  return { items, unreadCount };
}

export async function markNotificationRead(id: string, userId: string): Promise<void> {
  // Scoped by userId too, not just id — same "never trust the id alone"
  // rule every other owned-resource action in this app follows.
  await prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

/** Called when a customer opens a request's own detail page — clears
 * every notification tied to it in one go, rather than requiring them to
 * find and dismiss each one from the bell individually. */
export async function markNotificationsReadForRequest(requestType: NotificationRequestType, requestId: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({ where: { userId, requestType, requestId, readAt: null }, data: { readAt: new Date() } });
}

/** The bell's per-row "×" — hides one notification for good, read or not. */
export async function dismissNotification(id: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({ where: { id, userId, dismissedAt: null }, data: { dismissedAt: new Date() } });
}

/** The bell's "Clear all" — dismisses everything currently showing. */
export async function dismissAllNotifications(userId: string): Promise<void> {
  await prisma.notification.updateMany({ where: { userId, dismissedAt: null }, data: { dismissedAt: new Date() } });
}
