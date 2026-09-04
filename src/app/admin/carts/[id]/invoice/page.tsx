import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintableDocument } from "@/components/admin/PrintableDocument";

// `absolute` bypasses the admin layout's "%s · Ratnavue Admin" title
// template — a saved PDF is named exactly "CART-2026-0001.pdf".
export async function generateMetadata({ params }: PageProps<"/admin/carts/[id]/invoice">): Promise<Metadata> {
  const { id } = await params;
  const cart = await prisma.cart.findUnique({ where: { id }, select: { invoice: { select: { invoiceNumber: true } } } });
  return { title: { absolute: cart?.invoice?.invoiceNumber ?? "Invoice" } };
}

export default async function CartInvoicePage({ params }: PageProps<"/admin/carts/[id]/invoice">) {
  const { id } = await params;
  const cart = await prisma.cart.findUnique({
    where: { id },
    include: { user: true, items: true, invoice: true, discountCode: true },
  });

  // No invoice yet means there's nothing to print — the cart detail page
  // only links here once one's been generated, but this guards direct URL
  // access too.
  if (!cart || !cart.invoice) notFound();

  const lineItems = cart.items.map((item) => ({ label: item.label, quantity: 1, amount: item.amount }));
  if (cart.discountAmount != null) {
    lineItems.push({ label: `Discount (${cart.discountCode?.code ?? "—"})`, quantity: 1, amount: -cart.discountAmount });
  }

  return (
    <PrintableDocument
      kind="Invoice"
      reference={cart.invoice.invoiceNumber}
      issuedDate={cart.invoice.issuedAt}
      customerName={cart.user.name ?? cart.user.email}
      customerEmail={cart.user.email}
      customerPhone={cart.user.phone}
      items={lineItems}
      amount={cart.invoice.amount}
      footerNote="Thank you for your business. Payment is by wire transfer — see your account for instructions, or contact us directly."
      backHref={`/admin/carts/${cart.id}`}
      backLabel="Back to cart"
    />
  );
}
