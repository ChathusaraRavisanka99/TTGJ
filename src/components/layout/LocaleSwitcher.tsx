"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, ChevronDown } from "lucide-react";
import { setLocale } from "@/actions/locale";
import type { AppLocale } from "@/i18n/request";
import { cn } from "@/lib/utils";

const LANGUAGE_LABELS: Record<AppLocale, { code: string; name: string }> = {
  en: { code: "EN", name: "English" },
  es: { code: "ES", name: "Español" },
  fr: { code: "FR", name: "Français" },
  de: { code: "DE", name: "Deutsch" },
  pt: { code: "PT", name: "Português" },
  si: { code: "SI", name: "සිංහල" },
  ta: { code: "TA", name: "தமிழ்" },
};

/**
 * Same dropdown shape as AccountMenu (click-outside-to-close, absolutely
 * positioned panel) — deliberately not sharing that component directly
 * since its list is account-specific, but the interaction pattern is
 * copied on purpose so the two read as one family of nav controls.
 *
 * setLocale (a Server Action) sets the cookie src/i18n/request.ts reads
 * per request and calls revalidatePath("/", "layout") — but that alone
 * only marks the cache stale for the *next* navigation. Since switching
 * language isn't a navigation, router.refresh() is what actually re-fetches
 * the current route's RSC payload under the new locale right away.
 */
export function LocaleSwitcher({ locale, transparent }: { locale: AppLocale; transparent: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function choose(next: AppLocale) {
    setOpen(false);
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-label="Change language"
        className={cn(
          "flex items-center gap-1.5 text-sm transition-colors duration-300 disabled:opacity-50",
          transparent ? "text-ivory/85 hover:text-ivory" : "text-charcoal/80 hover:text-charcoal",
        )}
      >
        <Globe size={16} />
        {LANGUAGE_LABELS[locale].code}
        <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-lg border border-border-subtle bg-surface py-1.5 shadow-lg">
          {Object.entries(LANGUAGE_LABELS).map(([code, { name }]) => (
            <button
              key={code}
              type="button"
              onClick={() => choose(code as AppLocale)}
              className={cn(
                "block w-full px-4 py-2 text-left text-sm hover:bg-ivory-soft hover:text-charcoal",
                code === locale ? "font-medium text-charcoal" : "text-charcoal/75",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
