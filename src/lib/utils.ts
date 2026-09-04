import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sanitizes a `callbackUrl`-style redirect target — a value that always
// originates from a URL query param (login/register links built by
// middleware, or crafted by anyone), never something the server itself
// generated. Only a root-relative, same-origin path is ever returned;
// anything else falls back. Without this, a link like
// /account/login?callbackUrl=https://evil.example would send a customer
// straight to a phishing site immediately after a real, successful sign-in
// (CWE-601 open redirect) — the browser trusts the address bar during
// login, so landing on this domain first makes the handoff far more
// convincing than a cold phishing link would be on its own.
//
// "//evil.example" and "/\evil.example" are rejected too — browsers
// resolve a leading "//" (and, historically, "/\") as protocol-relative,
// i.e. still an absolute URL to another host, not a path on this one.
export function safeCallbackPath(raw: unknown, fallback = "/account"): string {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
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
