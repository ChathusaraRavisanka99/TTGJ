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
