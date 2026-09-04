import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pollChatMessages } from "@/actions/chat";
import { QuoteStatusBadge } from "@/components/ui/Badge";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { BackLink } from "@/components/admin/BackLink";
import { formatPrice } from "@/lib/utils";
import type { ConfiguredSpec } from "@/lib/validation/quote";

export default async function AccountQuoteDetailPage({ params }: PageProps<"/account/quotes/[id]">) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const quote = await prisma.quoteRequest.findUnique({
    where: { id },
    include: { gemstone: true, jewelry: true },
  });
  // Same "not found" whether the id is wrong or belongs to someone else
  // — never confirms a guessed id exists but isn't theirs.
  if (!quote || quote.userId !== session.user.id) notFound();

  const spec = quote.configuredSpec as ConfiguredSpec | null;
  const label = quote.gemstone?.name ?? quote.jewelry?.name ?? (spec ? `Configured ${spec.mineralName} (${spec.cutName})` : "Item");

  const [openCart, initialMessages] = await Promise.all([
    prisma.cart.findFirst({ where: { userId: session.user.id, status: "OPEN" }, include: { items: true } }),
    pollChatMessages("quote", id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <BackLink href="/account/quotes" label="Back to My Quote Requests" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Quote Request</p>
          <h1 className="mt-2 font-serif text-3xl text-charcoal">{label}</h1>
        </div>
        <QuoteStatusBadge status={quote.status} />
      </div>

      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-border-subtle bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-charcoal/45">Details</p>
          <p className="mt-1 text-sm text-charcoal/60">Submitted {quote.createdAt.toLocaleDateString()} · Qty {quote.quantity}</p>
          {quote.quotedPrice != null && (
            <div className="mt-3 flex items-baseline justify-between border-t border-border-subtle pt-3">
              <p className="font-serif text-xl text-charcoal">{formatPrice(quote.quotedPrice)}</p>
              {quote.quoteValidUntil && <p className="text-xs text-charcoal/45">Valid until {quote.quoteValidUntil.toLocaleDateString()}</p>}
            </div>
          )}
          {quote.note && <p className="mt-3 text-sm text-charcoal/70">&ldquo;{quote.note}&rdquo;</p>}
          {quote.adminNotes && (
            <div className="mt-3 rounded-lg bg-ivory-soft p-3 text-sm text-charcoal/75">
              <p className="text-xs uppercase tracking-wide text-charcoal/45">From Ratnavue</p>
              <p className="mt-1">{quote.adminNotes}</p>
            </div>
          )}
        </div>

        <ChatPanel
          requestType="quote"
          requestId={id}
          currentUserId={session.user.id}
          initialMessages={initialMessages}
          hasOpenCart={!!openCart && openCart.items.length > 0}
        />
      </div>
    </div>
  );
}
