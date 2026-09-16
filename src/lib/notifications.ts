import { prisma } from "@/lib/prisma";
import type { ChatRequestType } from "@/lib/chat";
import type { NotificationType } from "@prisma/client";

/** Fires a customer-facing notification — see the Notification model's own
 * doc comment for why this is a discrete row rather than reusing
 * ChatThread's running "unread since" scheme. Called from sendChatMessage
 * (an admin's reply) and updateQuoteRequest/updateSourcingRequest (a
 * status change) — never from the customer's own actions, since they
 * don't need to be notified of their own message/request. */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  message: string;
  requestType: ChatRequestType;
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

/** The bell dropdown's data — the customer's most recent notifications
 * (read and unread both, so the list doesn't empty out the moment
 * everything's read) plus a separate unread count for the badge. */
export async function getNotificationsForUser(userId: string) {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
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
export async function markNotificationsReadForRequest(requestType: ChatRequestType, requestId: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({ where: { userId, requestType, requestId, readAt: null }, data: { readAt: new Date() } });
}
