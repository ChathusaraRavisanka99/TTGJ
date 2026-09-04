import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { PrintButton } from "@/components/admin/PrintButton";

const dateFormat: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };

/**
 * Shared layout for the printable Quote and Invoice views. On-brand rather
 * than a plain gray document — gold accents, serif headings, the same
 * visual language as the rest of the site — since this is the one piece of
 * Ratnavue a customer might actually keep (a saved PDF, a printed page),
 * not just an admin screen.
 *
 * print:[color-adjust:exact] forces the gold accents to survive into the
 * printed/saved-PDF output: browsers strip background colors during print
 * by default unless told otherwise, which would otherwise flatten this
 * back to plain grayscale exactly when it matters most.
 */
export interface PrintableLineItem {
  label: string;
  specLine?: string | null;
  quantity: number;
  amount: number;
}

export function PrintableDocument({
  kind,
  reference,
  issuedDate,
  validUntil,
  customerName,
  customerEmail,
  customerPhone,
  items,
  amount,
  footerNote,
  backHref,
  backLabel,
}: {
  kind: "Quote" | "Invoice";
  reference: string;
  issuedDate: Date;
  validUntil?: Date | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  /** One row per accepted quote/sourcing request — a plain per-quote Quote
   * or Invoice always has exactly one; a cart invoice can have several,
   * which is the whole reason this is an array rather than flat props. */
  items: PrintableLineItem[];
  /** The document's total — always the sum of items' own amounts, but
   * passed explicitly rather than derived so callers don't each redo that
   * arithmetic (and floating-point summation) themselves. */
  amount: number;
  footerNote?: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={backHref} className="text-sm text-charcoal/60 underline decoration-charcoal/30 underline-offset-2 hover:text-charcoal">
          ← {backLabel}
        </Link>
        <PrintButton />
      </div>

      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm print:rounded-none print:border-0 print:shadow-none print:[-webkit-print-color-adjust:exact] print:[color-adjust:exact] print:[print-color-adjust:exact]">
        <div className="h-1.5 bg-gradient-to-r from-gold via-gold-soft to-gold" />

        <div className="p-10 sm:p-14">
          <div className="flex items-start justify-between gap-6 pb-8">
            <div>
              <p className="font-serif text-3xl tracking-wide text-charcoal">Ratnavue</p>
              <p className="mt-1.5 text-xs uppercase tracking-[0.25em] text-charcoal/45">Ceylon Gemstones &amp; Fine Jewelry</p>
            </div>
            <div className="text-right">
              <p className="font-serif text-2xl uppercase tracking-[0.15em] text-gold">{kind}</p>
              <p className="mt-2 inline-block rounded-full bg-gold/10 px-3 py-1 font-mono text-xs tracking-wide text-charcoal/70">
                {reference}
              </p>
              <p className="mt-2 text-sm text-charcoal/60">{issuedDate.toLocaleDateString("en-US", dateFormat)}</p>
              {validUntil && (
                <p className="text-sm text-charcoal/60">Valid until {validUntil.toLocaleDateString("en-US", dateFormat)}</p>
              )}
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-gold/40 via-border-subtle to-transparent" />

          <div className="mt-8">
            <p className="text-xs uppercase tracking-wide text-charcoal/45">
              {kind === "Invoice" ? "Billed to" : "Prepared for"}
            </p>
            <p className="mt-1.5 font-serif text-lg text-charcoal">{customerName}</p>
            <p className="text-sm text-charcoal/60">{customerEmail}</p>
            {customerPhone && <p className="text-sm text-charcoal/60">{customerPhone}</p>}
          </div>

          <table className="mt-10 w-full text-sm">
            <thead>
              <tr className="border-b border-gold/30 text-left text-xs uppercase tracking-wide text-charcoal/45">
                <th className="pb-2.5 font-normal">Item</th>
                <th className="pb-2.5 text-right font-normal">Qty</th>
                <th className="pb-2.5 text-right font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-border-subtle">
                  <td className="py-5 align-top text-charcoal">
                    {item.label}
                    {item.specLine && <span className="mt-1 block text-xs text-charcoal/55">{item.specLine}</span>}
                  </td>
                  <td className="py-5 text-right align-top text-charcoal/70">{item.quantity}</td>
                  <td className="py-5 text-right align-top text-charcoal">{formatPrice(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Full-width rule (echoing the one under the header) rather than
              a short bar clipped to the total box's own width — that read
              as a stray fragment disconnected from the rest of the
              document instead of a section divider. */}
          <div className="mt-2 h-px bg-gradient-to-r from-transparent via-border-subtle to-gold/50" />
          <div className="mt-4 flex justify-end">
            <div className="flex w-64 items-center justify-between">
              <p className="text-sm uppercase tracking-wide text-charcoal/60">Total</p>
              <p className="font-serif text-2xl text-gold">{formatPrice(amount)}</p>
            </div>
          </div>

          {footerNote && (
            <div className="mt-14 border-t border-border-subtle pt-6">
              <p className="font-serif text-base italic text-charcoal/70">Thank you for choosing Ratnavue.</p>
              <p className="mt-2 text-xs leading-relaxed text-charcoal/50">{footerNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
