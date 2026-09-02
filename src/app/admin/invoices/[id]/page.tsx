import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintableDocument } from "@/components/admin/PrintableDocument";
import { getQuoteGemVisual } from "@/lib/quote-visual";
import type { ConfiguredSpec } from "@/lib/validation/quote";

export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: PageProps<"/admin/invoices/[id]">) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      user: true,
      quoteRequest: {
        include: {
          gemstone: { include: { cut: true, mineral: true, clarityGrade: true } },
          jewelry: true,
        },
      },
    },
  });

  if (!invoice) notFound();

  const quote = invoice.quoteRequest;
  const gemVisual = getQuoteGemVisual(quote);
  const spec = quote.configuredSpec as ConfiguredSpec | null;

  const itemLabel = quote.gemstone?.name ?? quote.jewelry?.name ?? (spec ? `Configured ${spec.mineralName}` : "Item");
  const itemSpecLine = gemVisual
    ? `${gemVisual.caratWeight}ct ${gemVisual.cutName} ${gemVisual.mineralName} · ${gemVisual.clarityName}`
    : quote.jewelry
      ? `${quote.jewelry.pieceType.charAt(0)}${quote.jewelry.pieceType.slice(1).toLowerCase()} · ${quote.jewelry.metalType.replaceAll("_", " ")}`
      : null;

  return (
    <PrintableDocument
      kind="Invoice"
      reference={invoice.invoiceNumber}
      issuedDate={invoice.issuedAt}
      customerName={invoice.user.name ?? invoice.user.email}
      customerEmail={invoice.user.email}
      customerPhone={invoice.user.phone}
      itemLabel={itemLabel}
      itemSpecLine={itemSpecLine}
      quantity={quote.quantity}
      amount={invoice.amount}
      footerNote="Thank you for your business. This invoice reflects a price agreed directly with Ratnavue's gemological team."
      backHref={`/admin/quotes/${quote.id}`}
      backLabel="Back to quote"
    />
  );
}
