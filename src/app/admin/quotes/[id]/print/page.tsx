import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintableDocument } from "@/components/admin/PrintableDocument";
import { getQuoteGemVisual } from "@/lib/quote-visual";
import { quoteReference } from "@/lib/utils";
import type { ConfiguredSpec } from "@/lib/validation/quote";

// `absolute` bypasses the admin layout's "%s · Ratnavue Admin" title
// template — the browser's "Save as PDF" filename defaults to the page
// title, so this keeps a saved quote named exactly "Q-XXXXXXXX.pdf".
export async function generateMetadata({ params }: PageProps<"/admin/quotes/[id]/print">): Promise<Metadata> {
  const { id } = await params;
  return { title: { absolute: quoteReference(id) } };
}

export default async function PrintableQuotePage({ params }: PageProps<"/admin/quotes/[id]/print">) {
  const { id } = await params;
  const quote = await prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      user: true,
      gemstone: { include: { cut: true, mineral: true, clarityGrade: true } },
      jewelry: true,
    },
  });

  // No price yet means there's nothing to print — the admin quote page
  // only links here once quotedPrice is set, but this guards direct URL
  // access too.
  if (!quote || quote.quotedPrice == null) notFound();

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
      kind="Quote"
      reference={quoteReference(quote.id)}
      issuedDate={quote.quotedAt ?? quote.updatedAt}
      validUntil={quote.quoteValidUntil}
      customerName={quote.user.name ?? quote.user.email}
      customerEmail={quote.user.email}
      customerPhone={quote.user.phone}
      items={[{ label: itemLabel, specLine: itemSpecLine, quantity: quote.quantity, amount: quote.quotedPrice }]}
      amount={quote.quotedPrice}
      footerNote="This is a quotation, not a binding invoice. Pricing is subject to confirmation of stone/piece availability at the time of acceptance."
      backHref={`/admin/quotes/${quote.id}`}
      backLabel="Back to quote"
    />
  );
}
