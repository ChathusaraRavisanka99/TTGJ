"use client";

import { useMemo, useState } from "react";
import type { SubcultureDef } from "@/lib/subculture-collections";
import type { CollectionCardData } from "@/lib/subculture-items";
import { CollectionProductCard } from "@/components/collections/CollectionProductCard";
import { cn } from "@/lib/utils";

const controlClass =
  "rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-white/30";

// <option> elements render in the browser's own native dropdown popup, not
// this component's dark-themed box — Chrome/Firefox/Edge do honor `color`/
// `background-color` set directly on <option>, but the select's inherited
// text-white/80 was leaking into that popup with no matching dark
// background, so every option rendered as near-invisible light text on the
// popup's default white background. Setting both explicitly on each
// <option> fixes that without touching the (correctly dark-on-dark)
// trigger itself.
const optionClass = "bg-neutral-900 text-white";

function matchesSection(item: CollectionCardData, hints: string[]): boolean {
  const mineral = item.mineralName?.toLowerCase() ?? "";
  return hints.some((hint) => mineral.includes(hint));
}

/** Client-side filter bar + product grid over an already-fetched,
 * curated collection — no server pagination, the same "small collection,
 * filter in memory" reasoning /promotions/collection uses (see the plan:
 * these stay curated, not full-catalog scale). Renders either one flat
 * grid (theme.collectionGridLabel) or the theme's named thematic
 * sections (Vampire's Blood Red/Midnight/Twilight, Witchy's
 * Moon/Shadow/Mystic/Ember), each independently filtered. */
export function CollectionGrid({ items, theme }: { items: CollectionCardData[]; theme: SubcultureDef }) {
  const [gemstone, setGemstone] = useState("");
  const [type, setType] = useState<"" | "gemstone" | "jewelry">("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  const gemstoneOptions = useMemo(() => Array.from(new Set(items.map((i) => i.mineralName).filter(Boolean))).sort() as string[], [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (gemstone && item.mineralName !== gemstone) return false;
      if (type === "gemstone" && item.pieceTypeLabel) return false;
      if (type === "jewelry" && !item.pieceTypeLabel) return false;
      if (inStockOnly && item.stockStatus !== "AVAILABLE") return false;
      if (maxPrice) {
        const price = item.retailPrice ?? (item.showPrice ? item.price : null);
        if (price == null || price > Number(maxPrice)) return false;
      }
      return true;
    });
  }, [items, gemstone, type, maxPrice, inStockOnly]);

  const groups = theme.sections
    ? theme.sections.map((section) => ({ section, items: filtered.filter((item) => matchesSection(item, section.mineralHints)) }))
    : [{ section: null, items: filtered }];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <select value={gemstone} onChange={(e) => setGemstone(e.target.value)} className={controlClass}>
          <option className={optionClass} value="">All Gemstones</option>
          {gemstoneOptions.map((g) => (
            <option key={g} className={optionClass} value={g}>{g}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={controlClass}>
          <option className={optionClass} value="">All Types</option>
          <option className={optionClass} value="gemstone">Loose Gemstones</option>
          <option className={optionClass} value="jewelry">Jewelry</option>
        </select>
        <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={controlClass}>
          <option className={optionClass} value="">Any Price</option>
          <option className={optionClass} value="500">Up to $500</option>
          <option className={optionClass} value="1000">Up to $1,000</option>
          <option className={optionClass} value="2500">Up to $2,500</option>
          <option className={optionClass} value="5000">Up to $5,000</option>
        </select>
        <label className={cn(controlClass, "flex cursor-pointer items-center gap-2")}>
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-current" />
          In Stock Only
        </label>
      </div>

      {filtered.length === 0 && (
        <p className={cn("mt-12 text-center text-sm opacity-60", theme.bodyClass)}>No pieces match those filters right now.</p>
      )}

      {groups.map(({ section, items: groupItems }) => {
        if (groupItems.length === 0) return null;
        return (
          <div key={section?.key ?? "all"} className="mt-10">
            <h2 className={cn("font-serif text-2xl", theme.headingClass)}>{section?.label ?? theme.collectionGridLabel}</h2>
            {section && <p className={cn("mt-1.5 max-w-md text-sm opacity-70", theme.bodyClass)}>{section.description}</p>}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {groupItems.map((item, i) => (
                <CollectionProductCard key={item.id} item={item} theme={theme} priority={i < 4} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
