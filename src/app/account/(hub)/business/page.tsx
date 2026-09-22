import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMarket } from "@/lib/market";
import { withMarket } from "@/lib/market-shared";
import { SectionCard, EmptyNote } from "@/components/account/SectionCard";
import { CopyLinkButton } from "@/components/account/CopyLinkButton";
import { OrderCard, orderCardInclude } from "@/components/account/OrderCard";

export const metadata: Metadata = { title: "Business Account" };

// The team's shared view: every order placed by any member (via
// Order.businessAccountId, stamped at checkout — see actions/checkout.ts),
// and, for the owner only, the member list and an invite link. Deliberately
// separate from each member's own /account/orders, which never shows
// anyone else's orders regardless of team membership.
export default async function BusinessAccountPage() {
  const session = await auth();
  if (!session?.user) return null; // proxy.ts guards this route

  const [user, market] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { businessAccountId: true, businessRole: true } }),
    getMarket(),
  ]);
  if (!user.businessAccountId) notFound();

  const business = await prisma.businessAccount.findUniqueOrThrow({
    where: { id: user.businessAccountId },
    include: {
      members: { select: { id: true, name: true, email: true, businessRole: true }, orderBy: { businessRole: "asc" } },
      orders: { include: orderCardInclude, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  const isOwner = user.businessRole === "OWNER";
  const inviteHref = withMarket(`/account/business/join/${business.id}`, market);
  const inviteUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}${inviteHref}`;

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold-deep">Business</p>
        <h1 className="mt-2 font-serif text-4xl text-charcoal">{business.name}</h1>
      </div>

      {isOwner && (
        <SectionCard title="Team">
          <div className="p-5">
            <p className="text-sm text-charcoal/70">Share this link to invite a colleague — they&apos;ll join your team the moment they sign in or register.</p>
            <div className="mt-3"><CopyLinkButton value={inviteUrl} /></div>
          </div>
          <div className="divide-y divide-border-subtle px-5 pb-2">
            {business.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-charcoal">{m.name ?? m.email}</p>
                  <p className="text-xs text-charcoal/60">{m.email}</p>
                </div>
                <span className="rounded-full border border-border-subtle bg-ivory-soft px-2.5 py-0.5 text-xs text-charcoal/70">{m.businessRole}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Business Orders">
        {business.orders.length === 0 ? (
          <EmptyNote>No orders placed under this team yet.</EmptyNote>
        ) : (
          <div className="space-y-4 p-5">
            {business.orders.map((order) => (
              <OrderCard key={order.id} order={order} compact />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
