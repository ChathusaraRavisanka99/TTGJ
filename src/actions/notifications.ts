"use server";

import { auth } from "@/lib/auth";
import { getNotificationsForUser, markAllNotificationsRead as markAllRead, markNotificationRead as markOneRead } from "@/lib/notifications";
import type { ChatRequestType } from "@/lib/chat";
import type { ActionResult } from "./auth";

/** The bell's polling endpoint — same "plain polling, not a websocket"
 * convention pollChatMessages already uses (see actions/chat.ts), for the
 * same reason: bridging NextAuth sessions into a realtime channel's own
 * auth isn't worth it for a feed this low-frequency. Returns an empty
 * result rather than an error when signed out, since the bell simply
 * doesn't render then. */
export async function pollNotifications() {
  const session = await auth();
  if (!session?.user) return { items: [], unreadCount: 0 };

  const { items, unreadCount } = await getNotificationsForUser(session.user.id);
  return {
    unreadCount,
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      requestType: n.requestType as ChatRequestType,
      requestId: n.requestId,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export type NotificationView = Awaited<ReturnType<typeof pollNotifications>>["items"][number];

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };
  await markOneRead(id, session.user.id);
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };
  await markAllRead(session.user.id);
  return { ok: true };
}
