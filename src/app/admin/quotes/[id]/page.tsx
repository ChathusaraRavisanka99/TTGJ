import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QuoteStatusBadge } from "@/components/ui/Badge";
import { QuoteStatusForm } from "@/components/admin/QuoteStatusForm";
import { QuoteGemPreview } from "@/components/admin/QuoteGemPreview";
import { getQuoteGemVisual } from "@/lib/quote-visual";
import type { ConfiguredSpec } from "@/lib/validation/quote";

export default async function AdminQuoteDetailPage({ params }: PageProps<"/admin/quotes/[id]">) {
  const { id } = await params;
  const quote = await prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      user: true,
      gemstone: { include: { cut: true, mineral: true, clarityGrade: true } },
      jewelry: true,
    },
  });

  if (!quote) notFound();

  const spec = quote.configuredSpec as ConfiguredSpec | null;
  const gemVisual = getQuoteGemVisual(quote);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Quote Request</h1>
        <QuoteStatusBadge status={quote.status} />
      </div>

      {/* Wide screens have plenty of room to spare — a fixed-width side
          panel for customer info + the status-management action, and a
          wider main column for the item/gem/note detail, instead of both
          squeezed into a max-w-3xl centre column with the rest of the
          page left bare. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/45">Item</p>
            {quote.gemstone && (
              <Link href={`/admin/gems/${quote.gemstone.id}`} className="mt-1 block text-charcoal hover:text-gold">{quote.gemstone.name}</Link>
            )}
            {quote.jewelry && (
              <Link href={`/admin/jewelry/${quote.jewelry.id}`} className="mt-1 block text-charcoal hover:text-gold">{quote.jewelry.name}</Link>
            )}
            {!quote.gemstone && !quote.jewelry && spec && (
              <p className="mt-1 text-charcoal">Configured gem</p>
            )}
            <p className="mt-2 text-sm text-charcoal/60">Quantity: {quote.quantity}</p>
            <p className="text-xs text-charcoal/45">Submitted {quote.createdAt.toLocaleString()}</p>
          </div>

          {gemVisual && (
            <div className="rounded-xl border border-border-subtle bg-surface p-5">
              <p className="text-xs uppercase tracking-wide text-charcoal/45">Colour &amp; Cut</p>
              <div className="mt-3">
                <QuoteGemPreview visual={gemVisual} seedKey={quote.id} />
              </div>
            </div>
          )}

          {quote.note && (
            <div className="rounded-xl border border-border-subtle bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-charcoal/45">Customer Note</p>
                {quote.noteFlaggedForPrice && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-800">⚠ May contain a price offer — review</span>
                )}
              </div>
              <p className="mt-2 text-sm text-charcoal">{quote.note}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/45">Customer</p>
            <p className="mt-1 text-charcoal">{quote.user.name}</p>
            <p className="text-sm text-charcoal/60">{quote.user.email}</p>
            {quote.user.phone && <p className="text-sm text-charcoal/60">{quote.user.phone}</p>}
            <Link href={`/admin/customers/${quote.user.id}`} className="mt-2 inline-block text-xs text-gold underline">
              View customer history
            </Link>
          </div>

          <QuoteStatusForm id={quote.id} kind="quote" currentStatus={quote.status} currentAdminNotes={quote.adminNotes ?? ""} />
        </div>
      </div>
    </div>
  );
}
