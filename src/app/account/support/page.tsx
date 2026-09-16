import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pollChatMessages } from "@/actions/chat";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { markNotificationsReadForRequest } from "@/lib/notifications";

export const metadata: Metadata = { title: "Chat with Support" };

// The general "chat with support" thread — see ChatThread.generalUserId.
// Unlike /account/quotes/[id] and /account/sourcing/[id], there's no
// request row to look up or 404 on: requestId is simply the customer's
// own userId (see getChatContext's "general" branch in lib/chat.ts), and
// the thread itself is created lazily on the first message, same as
// every other chat thread.
export default async function AccountSupportPage() {
  const session = await auth();
  if (!session?.user) return null; // middleware guards this route

  const [openCart, initialMessages] = await Promise.all([
    prisma.cart.findFirst({ where: { userId: session.user.id, status: "OPEN" }, include: { items: true } }),
    pollChatMessages("general", session.user.id),
    markNotificationsReadForRequest("general", session.user.id, session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Support</p>
      <h1 className="mt-2 font-serif text-3xl text-charcoal">Chat with Support</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Have a question that isn&apos;t tied to a specific quote or sourcing request? Ask us here.
      </p>

      <div className="mt-8">
        <ChatPanel
          requestType="general"
          requestId={session.user.id}
          currentUserId={session.user.id}
          initialMessages={initialMessages}
          hasOpenCart={!!openCart && openCart.items.length > 0}
        />
      </div>
    </div>
  );
}
