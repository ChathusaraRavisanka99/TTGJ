import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pollChatMessages } from "@/actions/chat";
import { QuoteStatusBadge } from "@/components/ui/Badge";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { BackLink } from "@/components/admin/BackLink";
import { formatPrice } from "@/lib/utils";

export default async function AccountSourcingDetailPage({ params }: PageProps<"/account/sourcing/[id]">) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const request = await prisma.sourcingRequest.findUnique({ where: { id } });
  if (!request || request.userId !== session.user.id) notFound();

  const [openCart, initialMessages] = await Promise.all([
    prisma.cart.findFirst({ where: { userId: session.user.id, status: "OPEN" }, include: { items: true } }),
    pollChatMessages("sourcing", id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <BackLink href="/account/sourcing" label="Back to My Sourcing Requests" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Sourcing Request</p>
          <h1 className="mt-2 font-serif text-3xl text-charcoal">{request.mineralDescription}</h1>
        </div>
        <QuoteStatusBadge status={request.status} />
      </div>

      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-border-subtle bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-charcoal/45">Details</p>
          <p className="mt-1 text-sm text-charcoal/60">Submitted {request.createdAt.toLocaleDateString()}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-charcoal/65">
            {request.approxSize && <span>Size: {request.approxSize}</span>}
            {request.approxCut && <span>Cut: {request.approxCut}</span>}
            {request.approxColor && <span>Colour: {request.approxColor}</span>}
          </div>
          {request.quotedPrice != null && (
            <div className="mt-3 flex items-baseline justify-between border-t border-border-subtle pt-3">
              <p className="font-serif text-xl text-charcoal">{formatPrice(request.quotedPrice)}</p>
              {request.quoteValidUntil && <p className="text-xs text-charcoal/45">Valid until {request.quoteValidUntil.toLocaleDateString()}</p>}
            </div>
          )}
          {request.notes && <p className="mt-3 text-sm text-charcoal/70">&ldquo;{request.notes}&rdquo;</p>}
          {request.adminNotes && (
            <div className="mt-3 rounded-lg bg-ivory-soft p-3 text-sm text-charcoal/75">
              <p className="text-xs uppercase tracking-wide text-charcoal/45">From Ratnavue</p>
              <p className="mt-1">{request.adminNotes}</p>
            </div>
          )}
        </div>

        <ChatPanel
          requestType="sourcing"
          requestId={id}
          currentUserId={session.user.id}
          initialMessages={initialMessages}
          hasOpenCart={!!openCart && openCart.items.length > 0}
        />
      </div>
    </div>
  );
}
