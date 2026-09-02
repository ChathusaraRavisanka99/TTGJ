import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { PrintButton } from "@/components/admin/PrintButton";

/**
 * Shared layout for the printable Quote and Invoice views. Renders as a
 * plain, undecorated document — no admin chrome, card borders, or color
 * beyond the gold rule — since this is meant to look right on paper (or a
 * "Save as PDF" from the browser's print dialog), not as an admin screen.
 * AdminSidebar/layout padding hide themselves via print:hidden /
 * print:p-0 (see admin/layout.tsx) so only this component's own content
 * survives onto the page.
 */
export function PrintableDocument({
  kind,
  reference,
  issuedDate,
  validUntil,
  customerName,
  customerEmail,
  customerPhone,
  itemLabel,
  itemSpecLine,
  quantity,
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
  itemLabel: string;
  itemSpecLine?: string | null;
  quantity: number;
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

      <div className="rounded-xl border border-border-subtle bg-surface p-10 print:rounded-none print:border-0 print:p-0 sm:p-14">
        <div className="flex items-start justify-between gap-6 border-b border-border-subtle pb-8">
          <div>
            <p className="font-serif text-2xl tracking-wide text-charcoal">Ratnavue</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-charcoal/50">Ceylon Gemstones &amp; Fine Jewelry</p>
          </div>
          <div className="text-right">
            <p className="font-serif text-xl uppercase tracking-wide text-charcoal">{kind}</p>
            <p className="mt-1 text-sm text-charcoal/60">{reference}</p>
            <p className="text-sm text-charcoal/60">{issuedDate.toLocaleDateString()}</p>
            {validUntil && <p className="text-sm text-charcoal/60">Valid until {validUntil.toLocaleDateString()}</p>}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-wide text-charcoal/45">
            {kind === "Invoice" ? "Billed to" : "Prepared for"}
          </p>
          <p className="mt-1 text-charcoal">{customerName}</p>
          <p className="text-sm text-charcoal/60">{customerEmail}</p>
          {customerPhone && <p className="text-sm text-charcoal/60">{customerPhone}</p>}
        </div>

        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal/20 text-left text-xs uppercase tracking-wide text-charcoal/45">
              <th className="pb-2 font-normal">Item</th>
              <th className="pb-2 text-right font-normal">Qty</th>
              <th className="pb-2 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-subtle">
              <td className="py-4 align-top text-charcoal">
                {itemLabel}
                {itemSpecLine && <span className="mt-0.5 block text-xs text-charcoal/55">{itemSpecLine}</span>}
              </td>
              <td className="py-4 text-right align-top text-charcoal/70">{quantity}</td>
              <td className="py-4 text-right align-top text-charcoal">{formatPrice(amount)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-end border-t border-charcoal/20 pt-4">
          <div className="flex w-56 items-center justify-between">
            <p className="font-serif text-lg text-charcoal">Total</p>
            <p className="font-serif text-lg text-charcoal">{formatPrice(amount)}</p>
          </div>
        </div>

        {footerNote && <p className="mt-10 text-xs leading-relaxed text-charcoal/50">{footerNote}</p>}
      </div>
    </div>
  );
}
