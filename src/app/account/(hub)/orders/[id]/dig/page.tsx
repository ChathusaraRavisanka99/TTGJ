import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGemDigEligible, gemDigPointsRange } from "@/lib/gem-dig";
import { DigForGemAnimation } from "@/components/account/DigForGemAnimation";
import { BackLink } from "@/components/admin/BackLink";

export const metadata: Metadata = { title: "Dig for a Gem" };

export default async function DigForGemPage({ params }: PageProps<"/account/orders/[id]/dig">) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null; // proxy.ts guards this route

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        select: {
          quantity: true,
          lineTotal: true,
          gemstone: { select: { costPrice: true } },
          jewelry: { select: { costPrice: true } },
          jewelryVariant: { select: { costPrice: true } },
        },
      },
    },
  });
  // Same "not found" whether the id is wrong or belongs to someone else,
  // or there was simply never a reward on this order — never confirms a
  // guessed id exists but isn't theirs.
  if (!order || order.userId !== session.user.id) notFound();
  if (!isGemDigEligible(order) && order.gemDigPlayedAt == null) notFound();

  return (
    <div className="mx-auto w-full max-w-lg">
      <BackLink href={`/account/orders/${order.id}`} label="Back to Order" />
      <h1 className="mt-2 font-serif text-3xl text-charcoal">Order {order.orderNumber}</h1>

      <div className="mt-6">
        {order.gemDigPlayedAt != null ? (
          <div className="rounded-2xl border border-border-subtle bg-surface px-6 py-10 text-center">
            <p className="font-serif text-2xl text-gold-deep">+{(order.gemDigPointsAwarded ?? 0).toLocaleString()} points</p>
            <p className="mt-2 text-sm text-charcoal/65">You already dug on this order — added to your rewards balance.</p>
            <p className="mt-6 max-w-sm text-xs text-charcoal/65">
              This was a one-time bonus for this order. Ratnavue may change or remove the rewards program at any time.
            </p>
          </div>
        ) : (
          <DigForGemRange order={order} />
        )}
      </div>
    </div>
  );
}

async function DigForGemRange({ order }: { order: Parameters<typeof gemDigPointsRange>[0] }) {
  const { min, max } = await gemDigPointsRange(order);
  return <DigForGemAnimation orderId={order.id} min={min} max={max} />;
}
