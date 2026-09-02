import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuoteStatusBadge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import type { ConfiguredSpec } from "@/lib/validation/quote";

export const metadata: Metadata = { title: "My Quote Requests" };

export default async function AccountQuotesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const quotes = await prisma.quoteRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { gemstone: true, jewelry: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Account</p>
      <h1 className="mt-2 font-serif text-4xl text-charcoal">My Quote Requests</h1>

      {quotes.length === 0 ? (
        <p className="mt-10 text-charcoal/60">
          No quote requests yet. Browse our{" "}
          <Link href="/gems" className="underline">gemstones</Link> or{" "}
          <Link href="/jewelry" className="underline">jewelry</Link> to request one.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {quotes.map((q) => {
            const spec = q.configuredSpec as ConfiguredSpec | null;
            const label = q.gemstone?.name ?? q.jewelry?.name ?? (spec ? `Configured ${spec.mineralName} (${spec.cutName})` : "Item");
            return (
              <div key={q.id} className="rounded-xl border border-border-subtle bg-surface p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-serif text-lg text-charcoal">{label}</p>
                    <p className="mt-1 text-xs text-charcoal/50">
                      Submitted {q.createdAt.toLocaleDateString()} · Qty {q.quantity}
                    </p>
                  </div>
                  <QuoteStatusBadge status={q.status} />
                </div>
                {q.quotedPrice != null && (
                  <div className="mt-3 flex items-baseline justify-between border-t border-border-subtle pt-3">
                    <p className="font-serif text-xl text-charcoal">{formatPrice(q.quotedPrice)}</p>
                    {q.quoteValidUntil && (
                      <p className="text-xs text-charcoal/45">Valid until {q.quoteValidUntil.toLocaleDateString()}</p>
                    )}
                  </div>
                )}
                {q.note && <p className="mt-3 text-sm text-charcoal/70">&ldquo;{q.note}&rdquo;</p>}
                {q.adminNotes && (
                  <div className="mt-3 rounded-lg bg-ivory-soft p-3 text-sm text-charcoal/75">
                    <p className="text-xs uppercase tracking-wide text-charcoal/45">From Ratnavue</p>
                    <p className="mt-1">{q.adminNotes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
