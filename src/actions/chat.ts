"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  getChatContext,
  getOrCreateChatThread,
  getChatMessages,
  snapshotOpenCart,
  type ChatRequestType,
} from "@/lib/chat";
import type { ActionResult } from "./auth";

export type ChatTag = { type: "gemstone" | "jewelry"; id: string } | { type: "cart" };

function requestPaths(requestType: ChatRequestType, requestId: string): string[] {
  return requestType === "quote"
    ? [`/admin/quotes/${requestId}`, `/account/quotes/${requestId}`]
    : [`/admin/sourcing/${requestId}`, `/account/sourcing/${requestId}`];
}

/**
 * Both sides send through this one action — the only difference is
 * whether the caller has to *own* the request (a customer) or just be an
 * admin (who can message on any request). A customer messaging a request
 * that isn't theirs, or that doesn't exist, gets the same "not found"
 * either way — no distinction that would confirm a guessed id belongs to
 * someone else.
 */
export async function sendChatMessage(input: {
  requestType: ChatRequestType;
  requestId: string;
  body: string;
  tag?: ChatTag;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const context = await getChatContext(input.requestType, input.requestId);
  if (!context) return { ok: false, error: "Request not found." };

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && session.user.id !== context.customerId) return { ok: false, error: "Request not found." };

  const body = input.body.trim();
  if (!body && !input.tag) return { ok: false, error: "Write a message or attach something first." };
  if (body.length > 2000) return { ok: false, error: "Messages are limited to 2000 characters." };

  let taggedGemstoneId: string | undefined;
  let taggedJewelryId: string | undefined;
  let taggedCartSnapshot: object | undefined;

  if (input.tag?.type === "gemstone") {
    const gem = await prisma.gemstone.findUnique({ where: { id: input.tag.id }, select: { id: true } });
    if (!gem) return { ok: false, error: "That gemstone couldn't be found." };
    taggedGemstoneId = gem.id;
  } else if (input.tag?.type === "jewelry") {
    const piece = await prisma.jewelryPiece.findUnique({ where: { id: input.tag.id }, select: { id: true } });
    if (!piece) return { ok: false, error: "That jewelry piece couldn't be found." };
    taggedJewelryId = piece.id;
  } else if (input.tag?.type === "cart") {
    const snapshot = await snapshotOpenCart(context.customerId);
    if (!snapshot) return { ok: false, error: "There's no open cart with items to attach." };
    taggedCartSnapshot = snapshot;
  }

  const threadId = context.threadId ?? (await getOrCreateChatThread(input.requestType, input.requestId));

  await prisma.chatMessage.create({
    data: {
      threadId,
      senderId: session.user.id,
      senderRole: isAdmin ? "ADMIN" : "CUSTOMER",
      body: body || undefined,
      taggedGemstoneId,
      taggedJewelryId,
      taggedCartSnapshot,
    },
  });

  for (const path of requestPaths(input.requestType, input.requestId)) revalidatePath(path);
  return { ok: true };
}

/** Called when a thread is opened — records that this side has seen
 * everything up to now, which is what an unread count is measured
 * against (see getUnreadCount). A no-op if the thread doesn't exist yet
 * (nothing to have read). */
export async function markChatRead(requestType: ChatRequestType, requestId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const context = await getChatContext(requestType, requestId);
  if (!context) return { ok: false, error: "Request not found." };

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && session.user.id !== context.customerId) return { ok: false, error: "Request not found." };
  if (!context.threadId) return { ok: true }; // nothing sent yet

  await prisma.chatThread.update({
    where: { id: context.threadId },
    data: isAdmin ? { lastReadByAdminAt: new Date() } : { lastReadByCustomerAt: new Date() },
  });
  return { ok: true };
}

/**
 * The polling endpoint — called on an interval by the client panel (see
 * ChatPanel) to pick up new messages without a page reload. Same
 * ownership rule as sendChatMessage; returns an empty array rather than
 * an error for a thread that doesn't exist yet, since "no messages" is a
 * completely normal state here, not a failure.
 */
export async function pollChatMessages(requestType: ChatRequestType, requestId: string) {
  const session = await auth();
  if (!session?.user) return [];

  const context = await getChatContext(requestType, requestId);
  if (!context) return [];

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && session.user.id !== context.customerId) return [];

  const messages = await getChatMessages(context.threadId);
  return messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderRole: m.senderRole,
    senderName: m.sender.name ?? m.sender.email,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    taggedGemstone: m.taggedGemstone
      ? { name: m.taggedGemstone.name, slug: m.taggedGemstone.slug, price: m.taggedGemstone.price, showPrice: m.taggedGemstone.showPrice, imageUrl: m.taggedGemstone.media[0]?.url }
      : null,
    taggedJewelry: m.taggedJewelry
      ? { name: m.taggedJewelry.name, slug: m.taggedJewelry.slug, price: m.taggedJewelry.price, showPrice: m.taggedJewelry.showPrice, imageUrl: m.taggedJewelry.media[0]?.url }
      : null,
    taggedCartSnapshot: m.taggedCartSnapshot as { items: { label: string; amount: number }[]; total: number } | null,
  }));
}

export type ChatMessageView = Awaited<ReturnType<typeof pollChatMessages>>[number];

/** Either side can tag a catalog item, so this only requires being
 * signed in, not being an admin — the gemstone/jewelry pickers for the
 * composer need this same published-items list either way. */
export async function getChatTagOptions() {
  const session = await auth();
  if (!session?.user) return { gemstones: [], jewelry: [] };

  const [gemstones, jewelry] = await Promise.all([
    prisma.gemstone.findMany({ where: { isPublished: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.jewelryPiece.findMany({ where: { isPublished: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { gemstones, jewelry };
}
