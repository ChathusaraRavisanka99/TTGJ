"use client";

import Image from "next/image";
import Link from "@/components/ui/MarketLink";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { removeRetailCartItem } from "@/actions/retail-cart";
import { formatPrice, cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/components/providers/MarketProvider";

interface Item {
  id: string;
  quantity: number;
  unitPrice: number;
  label: string;
  href: string;
  imageUrl?: string;
  /** True once the underlying gemstone/jewelry piece is no longer
   * AVAILABLE (sold, reserved, or unpublished) — re-checked on every cart
   * page load, not just at checkout, so this doesn't sit as a silent
   * surprise until the customer tries to pay. See buildCheckoutBreakdown
   * for the same check enforced server-side. */
  unavailable: boolean;
}

export function RetailCartItemRow({ item }: { item: Item }) {
  const router = useRouter();
  const currency = useCurrency();
  const t = useTranslations("cart");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Previously: fire-and-forget, ignoring removeRetailCartItem's own
  // {ok:false} result entirely — a stale/already-removed item or an
  // expired session just silently did nothing, no differently from the
  // button being clicked while it was still loading. With this
  // environment's multi-second DB round-trips, that read as the row being
  // "stuck" (and, once a stray double-click's second request resolved,
  // occasionally as the item "reappearing"). Now failures show a message,
  // and the whole row visibly dims while the removal is in flight instead
  // of only the trash icon quietly disabling.
  function remove() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await removeRetailCartItem(item.id);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border-subtle py-4 last:border-0 transition-opacity",
        pending && "pointer-events-none opacity-50",
        item.unavailable && "opacity-60",
      )}
    >
      <Link href={item.href} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ivory-soft">
        {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={item.href} className="truncate text-sm font-medium text-charcoal hover:text-gold">
          {item.label}
        </Link>
        {item.unavailable ? (
          <p className="mt-0.5 text-sm font-medium text-red-700">{t("unavailable")}</p>
        ) : (
          <p className="mt-0.5 text-sm text-charcoal/60">{t("each", { price: formatPrice(item.unitPrice, currency) })}</p>
        )}
      </div>
      {/* Wraps to its own full-width row on narrow screens (basis-full),
          instead of sharing the item-name row's already-tight space —
          that's what was causing the price/quantity controls to overlap
          on a phone-width viewport. Stays inline, pushed to the right
          edge, from sm: up. */}
      <div className="flex w-full basis-full items-center justify-end gap-4 sm:w-auto sm:basis-auto">
        <button type="button" title={t("remove")} disabled={pending} onClick={remove} className="text-charcoal/65 hover:text-red-700 disabled:cursor-wait">
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
        <p className="w-20 shrink-0 text-right font-serif text-charcoal sm:w-24">{formatPrice(item.unitPrice * item.quantity, currency)}</p>
      </div>
      {error && <p className="w-full basis-full text-right text-xs text-red-700">{error}</p>}
    </div>
  );
}
