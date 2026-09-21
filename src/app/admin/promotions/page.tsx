import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSeasonalContent } from "@/lib/page-content";
import { getPageVisibility, marketVisibilityKey } from "@/lib/page-visibility";
import { MarketTabs, parseAdminMarket } from "@/components/admin/MarketTabs";
import { getPromotionItems, promotionItemLabel } from "@/lib/promotion-items";
import { METAL_TYPES } from "@/lib/gem-constants";
import { SEASONAL_THEME_KEYS, type SeasonalThemeKey } from "@/lib/seasonal-themes";
import { SeasonalContentForm } from "@/components/admin/SeasonalContentForm";
import { PageVisibilityControl } from "@/components/admin/PageVisibilityControl";
import { BackLink } from "@/components/admin/BackLink";

function pieceTypeLabel(pieceType: string): string {
  return pieceType.charAt(0) + pieceType.slice(1).toLowerCase();
}

function metalTypeLabel(metalType: string): string {
  return METAL_TYPES.find((m) => m.value === metalType)?.label ?? metalType;
}

export default async function AdminPromotionsPage({ searchParams }: PageProps<"/admin/promotions">) {
  const market = parseAdminMarket((await searchParams).market);
  const lk = market === "lk";
  const visibilityKey = marketVisibilityKey("seasonal", market);
  const [content, visibility, gemstoneRows, jewelryRows, promoItems] = await Promise.all([
    getSeasonalContent(market),
    getPageVisibility(visibilityKey),
    // Only the items that belong to this store — the catalogs don't overlap, so
    // a promotion can only ever feature its own store's listings.
    prisma.gemstone.findMany({
      where: { market },
      select: {
        id: true,
        name: true,
        price: true,
        lkrPrice: true,
        showPrice: true,
        caratWeight: true,
        mineral: { select: { name: true } },
        cut: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.jewelryPiece.findMany({
      where: { market },
      select: { id: true, name: true, price: true, lkrPrice: true, showPrice: true, pieceType: true, metalType: true, metalPurity: true },
      orderBy: { name: "asc" },
    }),
    // Every theme at once — 5 small collections are cheaper to fetch
    // together and slice per tab client-side than round-trip on every
    // tab switch, same reasoning the per-theme copy already follows.
    getPromotionItems(undefined, market),
  ]);

  // Current price + a one-line spec summary for each item, so an admin
  // picking one to promote can see what it already costs (and what it
  // is) right there in the picker, before typing in a promotional price
  // — rather than having to open the item's own edit page first to check.
  const gemstones = gemstoneRows.map((g) => ({
    id: g.id,
    name: g.name,
    price: lk ? g.lkrPrice : g.price,
    showPrice: g.showPrice,
    specs: `${g.caratWeight}ct ${g.mineral.name}, ${g.cut.name}`,
  }));
  const jewelry = jewelryRows.map((j) => ({
    id: j.id,
    name: j.name,
    price: lk ? j.lkrPrice : j.price,
    showPrice: j.showPrice,
    specs: `${pieceTypeLabel(j.pieceType)}, ${metalTypeLabel(j.metalType)}${j.metalPurity ? ` ${j.metalPurity}` : ""}`,
  }));

  const itemsByTheme = Object.fromEntries(SEASONAL_THEME_KEYS.map((key) => [key, [] as { id: string; label: string; promoPrice: number; regularPrice: number | null }[]])) as Record<
    SeasonalThemeKey,
    { id: string; label: string; promoPrice: number; regularPrice: number | null }[]
  >;
  for (const item of promoItems) {
    const product = item.gemstone ?? item.jewelry;
    const theme = item.theme as SeasonalThemeKey;
    if (!itemsByTheme[theme]) continue; // ignore any row whose theme key no longer exists
    itemsByTheme[theme].push({
      id: item.id,
      label: promotionItemLabel(item),
      promoPrice: item.promoPrice,
      regularPrice: product?.showPrice ? (lk ? product.lkrPrice : product.price) : null,
    });
  }

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Seasonal Promotions</h1>
        <Link href={lk ? "/lk/promotions" : "/promotions"} target="_blank" className="text-sm text-gold underline">
          View live page ↗
        </Link>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">
        A single themed page at /promotions — each theme has its own predefined kicker, heading, body, button, and
        promotional item collection, all editable. The same item can headline more than one theme&apos;s collection
        at once, each at its own price. Pick which theme is active, then switch the page Hidden, Coming Soon, or
        Live.
      </p>

      <MarketTabs basePath="/admin/promotions" current={market} />
      {lk && (
        <p className="mt-3 text-sm text-charcoal/60">
          Editing the <strong>Sri Lanka store&apos;s</strong> own promotion (/lk/promotions): its own visibility, active
          theme, copy and collections, with promotional prices in rupees. Nothing here affects the international site.
        </p>
      )}

      <div className="mt-8 rounded-xl border border-border-subtle bg-surface p-5">
        <PageVisibilityControl key={market} pageKey={visibilityKey} currentState={visibility} />
      </div>

      <div className="mt-8 border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Themes &amp; Collections</p>
        <div className="mt-4">
          <SeasonalContentForm key={market} initial={content} gemstones={gemstones} jewelry={jewelry} itemsByTheme={itemsByTheme} market={market} />
        </div>
      </div>
    </div>
  );
}
