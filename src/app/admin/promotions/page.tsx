import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSeasonalContent } from "@/lib/page-content";
import { getPageVisibility } from "@/lib/page-visibility";
import { getPromotionItems, promotionItemLabel } from "@/lib/promotion-items";
import { METAL_TYPES } from "@/lib/gem-constants";
import { SeasonalContentForm } from "@/components/admin/SeasonalContentForm";
import { PromotionItemsManager } from "@/components/admin/PromotionItemsManager";
import { PageVisibilityControl } from "@/components/admin/PageVisibilityControl";
import { BackLink } from "@/components/admin/BackLink";

function pieceTypeLabel(pieceType: string): string {
  return pieceType.charAt(0) + pieceType.slice(1).toLowerCase();
}

function metalTypeLabel(metalType: string): string {
  return METAL_TYPES.find((m) => m.value === metalType)?.label ?? metalType;
}

export default async function AdminPromotionsPage() {
  const [content, visibility, gemstoneRows, jewelryRows, promoItems] = await Promise.all([
    getSeasonalContent(),
    getPageVisibility("seasonal"),
    prisma.gemstone.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        showPrice: true,
        caratWeight: true,
        mineral: { select: { name: true } },
        cut: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.jewelryPiece.findMany({
      select: { id: true, name: true, price: true, showPrice: true, pieceType: true, metalType: true, metalPurity: true },
      orderBy: { name: "asc" },
    }),
    getPromotionItems(),
  ]);

  // Current price + a one-line spec summary for each item, so an admin
  // picking one to promote can see what it already costs (and what it
  // is) right there in the picker, before typing in a promotional price
  // — rather than having to open the item's own edit page first to check.
  const gemstones = gemstoneRows.map((g) => ({
    id: g.id,
    name: g.name,
    price: g.price,
    showPrice: g.showPrice,
    specs: `${g.caratWeight}ct ${g.mineral.name}, ${g.cut.name}`,
  }));
  const jewelry = jewelryRows.map((j) => ({
    id: j.id,
    name: j.name,
    price: j.price,
    showPrice: j.showPrice,
    specs: `${pieceTypeLabel(j.pieceType)}, ${metalTypeLabel(j.metalType)}${j.metalPurity ? ` ${j.metalPurity}` : ""}`,
  }));

  const items = promoItems.map((item) => {
    const product = item.gemstone ?? item.jewelry;
    return {
      id: item.id,
      label: promotionItemLabel(item),
      promoPrice: item.promoPrice,
      regularPrice: product?.showPrice ? product.price : null,
    };
  });

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Seasonal Promotions</h1>
        <Link href="/promotions" target="_blank" className="text-sm text-gold underline">
          View live page ↗
        </Link>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">
        A single themed page at /promotions — each theme has its own predefined kicker, heading, body, and button,
        all editable. Pick which one is active, add promotional items with their own price, and switch the page
        Hidden, Coming Soon, or Live.
      </p>

      <div className="mt-8 rounded-xl border border-border-subtle bg-surface p-5">
        <PageVisibilityControl pageKey="seasonal" currentState={visibility} />
      </div>

      <div className="mt-8 border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Theme &amp; Copy</p>
        <div className="mt-4">
          <SeasonalContentForm initial={content} />
        </div>
      </div>

      <div className="mt-10 border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Promotional Items</p>
        <p className="mt-1 text-sm text-charcoal/60">
          Items featured on the promotions page with their own promotional price. Purchasing still goes through the
          normal Request a Quote flow on the item&apos;s own page — this is what shows here and what a customer sees
          struck through against the regular price, where one is public.
        </p>
        <div className="mt-4">
          <PromotionItemsManager gemstones={gemstones} jewelry={jewelry} items={items} />
        </div>
      </div>
    </div>
  );
}
