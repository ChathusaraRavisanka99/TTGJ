import { ShieldCheck, Gem, Truck, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// Static, not admin-editable page content like the home page's marketing
// copy — these four claims are operational facts about how the business
// actually runs (grading, shipping, returns), not seasonal marketing copy
// an admin would want to rewrite, so they live in code like the nav links
// and footer structure do.
const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    label: "Certified & Independently Graded",
    detail: "Every stone verified by an accredited gemological lab",
  },
  {
    // Genuinely true rather than manufactured urgency: Gemstone/JewelryPiece
    // rows have no quantity field (see schema) — each listing really is the
    // one and only physical piece, so "won't be restocked" is a fact, not a
    // sales tactic.
    icon: Gem,
    label: "One of a Kind, Guaranteed",
    detail: "No mass production — each piece is a single, unrepeated find",
  },
  {
    icon: Truck,
    label: "Fully Insured Shipping",
    detail: "Discreet, tracked, and insured from Sri Lanka to your door",
  },
  {
    icon: RotateCcw,
    label: "30-Day Return Promise",
    detail: "Not the one? Send it back for a full refund, no questions asked",
  },
] as const;

/**
 * The site's trust/authenticity signals — the row of claims that answer a
 * first-time buyer's real hesitation ("is this genuine, and what if it
 * isn't right for me?") before they reach checkout. `variant="full"` is the
 * icon-plus-caption grid used on the footer; `variant="compact"` is a
 * single-line icon-plus-label list for tight spots like a product page's
 * buy box, right where that hesitation is highest.
 */
export function TrustBar({ variant = "full", className }: { variant?: "full" | "compact"; className?: string }) {
  if (variant === "compact") {
    return (
      <ul className={cn("flex flex-wrap gap-x-5 gap-y-2", className)}>
        {TRUST_ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 text-xs text-charcoal/65">
            <item.icon size={14} className="shrink-0 text-gold" aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("grid gap-8 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {TRUST_ITEMS.map((item) => (
        <div key={item.label} className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
            <item.icon size={17} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-charcoal">{item.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-charcoal/55">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
