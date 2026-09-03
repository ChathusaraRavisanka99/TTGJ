import Link from "next/link";
import { Printer, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { QuoteStatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { cn, formatPrice } from "@/lib/utils";
import { resolveGemColor } from "@/components/gem-visualizer/color";
import { getQuoteGemVisual } from "@/lib/quote-visual";
import { BackLink } from "@/components/admin/BackLink";

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "QUOTED", "ACCEPTED", "DECLINED", "EXPIRED"];
const PAGE_SIZE = 20;

export default async function AdminQuotesPage({ searchParams }: PageProps<"/admin/quotes">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where = status ? { status: status as never } : undefined;
  const [quotes, total] = await Promise.all([
    prisma.quoteRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: true,
        gemstone: { include: { cut: true, mineral: true, clarityGrade: true } },
        jewelry: true,
        invoice: true,
      },
    }),
    prisma.quoteRequest.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Quote Requests</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/quotes" className={cn("rounded-full border px-3 py-1 text-xs", !status ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/quotes?status=${s}`}
            className={cn("rounded-full border px-3 py-1 text-xs", status === s ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}
          >
            {s.replaceAll("_", " ")}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Flagged</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Documents</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const visual = getQuoteGemVisual(q);
              return (
              <tr key={q.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3">
                  <Link href={`/admin/quotes/${q.id}`} className="flex items-center gap-2 text-charcoal hover:text-gold">
                    {visual && (
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-border-subtle"
                        style={{ backgroundColor: resolveGemColor(visual.hue, visual.darkness, visual.saturation ?? 72).base }}
                        title={`${visual.mineralName} · ${visual.cutName}`}
                        aria-hidden
                      />
                    )}
                    {q.gemstone?.name ?? q.jewelry?.name ?? "Configured gem"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{q.user.email}</td>
                <td className="px-4 py-3 text-charcoal/70">{q.quantity}</td>
                <td className="px-4 py-3 text-charcoal/70">{q.quotedPrice != null ? formatPrice(q.quotedPrice) : "—"}</td>
                <td className="px-4 py-3 text-charcoal/70">{q.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3">{q.noteFlaggedForPrice ? <span className="text-amber-700">⚠ Price?</span> : "—"}</td>
                <td className="px-4 py-3"><QuoteStatusBadge status={q.status} /></td>
                <td className="px-4 py-3">
                  {q.quotedPrice != null ? (
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/quotes/${q.id}/print`}
                        title="Print quote"
                        className="flex items-center gap-1 text-xs text-charcoal/60 hover:text-gold"
                      >
                        <Printer size={14} /> Quote
                      </Link>
                      {q.invoice && (
                        <Link
                          href={`/admin/invoices/${q.invoice.id}`}
                          title="Print invoice"
                          className="flex items-center gap-1 text-xs text-charcoal/60 hover:text-gold"
                        >
                          <Receipt size={14} /> Invoice
                        </Link>
                      )}
                    </div>
                  ) : (
                    <span className="text-charcoal/30">—</span>
                  )}
                </td>
              </tr>
              );
            })}
            {quotes.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-charcoal/50">No quote requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
