import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { pollChatMessages } from "@/actions/chat";
import { QuoteStatusBadge } from "@/components/ui/Badge";
import { QuoteStatusForm } from "@/components/admin/QuoteStatusForm";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { BackLink } from "@/components/admin/BackLink";
import { formatPrice } from "@/lib/utils";

export default async function AdminSourcingDetailPage({ params }: PageProps<"/admin/sourcing/[id]">) {
  const { id } = await params;
  const [request, session] = await Promise.all([
    prisma.sourcingRequest.findUnique({ where: { id }, include: { user: true } }),
    auth(),
  ]);

  if (!request) notFound();

  const [openCart, initialMessages] = await Promise.all([
    prisma.cart.findFirst({ where: { userId: request.userId, status: "OPEN" }, include: { items: true } }),
    pollChatMessages("sourcing", id),
  ]);

  return (
    <div className="max-w-6xl">
      <BackLink href="/admin/sourcing" label="Back to Sourcing Requests" />
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Sourcing Request</h1>
        <QuoteStatusBadge status={request.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/45">Request Details</p>
            <p className="mt-1 text-charcoal">{request.mineralDescription}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-charcoal/60">
              {request.approxSize && <span>Size: {request.approxSize}</span>}
              {request.approxCut && <span>Cut: {request.approxCut}</span>}
              {request.approxColor && <span>Colour: {request.approxColor}</span>}
            </div>
            <p className="mt-2 text-xs text-charcoal/45">Submitted {request.createdAt.toLocaleString()}</p>
            {request.quotedPrice != null && (
              <div className="mt-3 flex items-baseline justify-between border-t border-border-subtle pt-3">
                <p className="font-serif text-lg text-charcoal">{formatPrice(request.quotedPrice)}</p>
                {request.quoteValidUntil && (
                  <p className="text-xs text-charcoal/45">Valid until {request.quoteValidUntil.toLocaleDateString()}</p>
                )}
              </div>
            )}
          </div>

          {request.notes && (
            <div className="rounded-xl border border-border-subtle bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-charcoal/45">Customer Notes</p>
                {request.noteFlaggedForPrice && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-800">⚠ May contain a price offer — review</span>
                )}
              </div>
              <p className="mt-2 text-sm text-charcoal">{request.notes}</p>
            </div>
          )}

          {session?.user && (
            <ChatPanel
              requestType="sourcing"
              requestId={request.id}
              currentUserId={session.user.id}
              initialMessages={initialMessages}
              hasOpenCart={!!openCart && openCart.items.length > 0}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/45">Customer</p>
            <p className="mt-1 text-charcoal">{request.user.name}</p>
            <p className="text-sm text-charcoal/60">{request.user.email}</p>
            {request.user.phone && <p className="text-sm text-charcoal/60">{request.user.phone}</p>}
            <Link href={`/admin/customers/${request.user.id}`} className="mt-2 inline-block text-xs text-gold underline">
              View customer history
            </Link>
          </div>

          <QuoteStatusForm
            id={request.id}
            kind="sourcing"
            currentStatus={request.status}
            currentAdminNotes={request.adminNotes ?? ""}
            currentQuotedPrice={request.quotedPrice}
            currentQuoteValidUntil={request.quoteValidUntil?.toISOString() ?? null}
          />
        </div>
      </div>
    </div>
  );
}
