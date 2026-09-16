import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { pollChatMessages } from "@/actions/chat";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminSupportDetailPage({ params }: PageProps<"/admin/support/[userId]">) {
  const { userId } = await params;
  const [customer, session] = await Promise.all([prisma.user.findUnique({ where: { id: userId } }), auth()]);

  if (!customer) notFound();

  const [openCart, initialMessages] = await Promise.all([
    prisma.cart.findFirst({ where: { userId, status: "OPEN" }, include: { items: true } }),
    pollChatMessages("general", userId),
  ]);

  return (
    <div className="max-w-6xl">
      <BackLink href="/admin/messages" label="Back to Messages" />
      <h1 className="font-serif text-3xl text-charcoal">Chat with Support</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {session?.user && (
            <ChatPanel
              requestType="general"
              requestId={userId}
              currentUserId={session.user.id}
              initialMessages={initialMessages}
              hasOpenCart={!!openCart && openCart.items.length > 0}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/45">Customer</p>
            <p className="mt-1 text-charcoal">{customer.name}</p>
            <p className="text-sm text-charcoal/60">{customer.email}</p>
            {customer.phone && <p className="text-sm text-charcoal/60">{customer.phone}</p>}
            <Link href={`/admin/customers/${customer.id}`} className="mt-2 inline-block text-xs text-gold underline">
              View customer history
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
