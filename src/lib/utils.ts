import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Substitutes a lab's `{certId}` placeholder with an actual certificate
// number to build a "Verify Certificate" link. Returns null whenever either
// piece is missing, so callers can just conditionally render on the result.
export function buildCertVerifyUrl(template: string | null | undefined, certId: string | null | undefined): string | null {
  if (!template || !certId) return null;
  return template.replace("{certId}", encodeURIComponent(certId));
}

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// Formats a price for display, e.g. 1240.5 -> "$1,241". Whether to call this
// at all is the caller's job — it's gated by each item's own `showPrice`
// flag, since price display is opt-in per item, not a site-wide switch.
export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}

// Quotes don't get their own sequential number the way invoices do (see
// nextInvoiceNumber in lib/invoicing.ts) — this derives a short, stable,
// human-presentable reference straight from the id instead, used both as
// the on-document reference and (via generateMetadata) as the printable
// page's title, which is what browsers default a "Save as PDF" filename
// to — so a saved quote PDF is named "Q-XXXXXXXX.pdf", not "Printable
// Quote.pdf".
export function quoteReference(id: string): string {
  return `Q-${id.slice(-8).toUpperCase()}`;
}
