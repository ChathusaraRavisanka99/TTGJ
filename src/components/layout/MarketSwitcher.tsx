"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppPathname, useMarket } from "@/components/providers/MarketProvider";
import { withMarket, type Market } from "@/lib/market-shared";
import { cn } from "@/lib/utils";

// The two storefronts, in the order shown. Labels come from messages
// ("market.intl" / "market.lk") so they're translated with everything else.
const MARKET_ORDER: Market[] = ["lk", "intl"];

function useSwitchHref() {
  const pathname = useAppPathname();
  // The same page in the other storefront ("/gems" <-> "/lk/gems"). The
  // query string is added on click (it isn't available during SSR without
  // opting the whole layout into useSearchParams), so filters carry over.
  return (target: Market) => withMarket(pathname, target);
}

function goTo(href: string) {
  window.location.assign(href + window.location.search);
}

/**
 * Storefront switcher — Sri Lanka (rupees) or International (dollars).
 * Deliberately a full page load rather than a soft navigation: the two
 * storefronts differ in pricing, cart, content and theme, all decided in the
 * root layout, so a clean load is the simplest way to guarantee nothing from
 * the other market lingers. No automatic redirect anywhere — visitors always
 * choose.
 */
export function MarketSwitcher({ transparent = false }: { transparent?: boolean }) {
  const t = useTranslations("market");
  const market = useMarket();
  const hrefFor = useSwitchHref();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("switchLabel")}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1.5 text-sm transition-colors duration-300",
          transparent ? "text-ivory/85 hover:text-ivory" : "text-charcoal/80 hover:text-charcoal",
        )}
      >
        <MapPin size={15} />
        {t(`short.${market}`)}
        <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-52 rounded-lg border border-border-subtle bg-surface py-1.5 shadow-lg">
          {MARKET_ORDER.map((m) => (
            <a
              key={m}
              href={hrefFor(m)}
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                if (m !== market) goTo(hrefFor(m));
              }}
              className={cn(
                "block px-4 py-2 text-sm hover:bg-ivory-soft hover:text-charcoal",
                m === market ? "font-medium text-charcoal" : "text-charcoal/75",
              )}
            >
              <span className="block">{t(`name.${m}`)}</span>
              <span className="block text-xs text-charcoal/65">{t(`detail.${m}`)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** Both options laid out flat — for the mobile menu and the footer. */
export function MarketSwitcherInline({ className }: { className?: string }) {
  const t = useTranslations("market");
  const market = useMarket();
  const hrefFor = useSwitchHref();

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label={t("switchLabel")}>
      {MARKET_ORDER.map((m) => (
        <a
          key={m}
          href={hrefFor(m)}
          aria-current={m === market ? "true" : undefined}
          onClick={(e) => {
            e.preventDefault();
            if (m !== market) goTo(hrefFor(m));
          }}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm transition-colors",
            m === market ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/75 hover:border-charcoal/40",
          )}
        >
          {t(`name.${m}`)}
        </a>
      ))}
    </div>
  );
}
