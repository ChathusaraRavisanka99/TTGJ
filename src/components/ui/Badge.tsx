import { cn } from "@/lib/utils";

const STOCK_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  RESERVED: "bg-amber-50 text-amber-800 border-amber-200",
  SOLD: "bg-charcoal/5 text-charcoal/60 border-charcoal/15",
};

const QUOTE_STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-sapphire-soft/15 text-sapphire border-sapphire-soft/30",
  UNDER_REVIEW: "bg-amber-50 text-amber-800 border-amber-200",
  QUOTED: "bg-gold-soft/25 text-charcoal border-gold/40",
  ACCEPTED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  DECLINED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-charcoal/5 text-charcoal/50 border-charcoal/15",
};

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide", className)}>
      {children}
    </span>
  );
}

export function StockBadge({ status }: { status: string }) {
  return <Badge className={STOCK_STYLES[status] ?? ""}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
}

export function QuoteStatusBadge({ status }: { status: string }) {
  return <Badge className={QUOTE_STATUS_STYLES[status] ?? ""}>{status.replaceAll("_", " ")}</Badge>;
}
