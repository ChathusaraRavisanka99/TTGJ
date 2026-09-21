import { prisma } from "@/lib/prisma";
import { getPageVisibilities } from "@/lib/page-visibility";
import { getAllSubcultureContent } from "@/lib/subculture-content";
import { getCollectionItems, collectionItemLabel } from "@/lib/subculture-items";
import { SUBCULTURE_KEYS, type SubcultureKey } from "@/lib/subculture-collections";
import { METAL_TYPES } from "@/lib/gem-constants";
import { SubcultureContentForm } from "@/components/admin/SubcultureContentForm";
import { BackLink } from "@/components/admin/BackLink";

function pieceTypeLabel(pieceType: string): string {
  return pieceType.charAt(0) + pieceType.slice(1).toLowerCase();
}

function metalTypeLabel(metalType: string): string {
  return METAL_TYPES.find((m) => m.value === metalType)?.label ?? metalType;
}

export default async function AdminAltCollectionsPage() {
  const [contentByCollection, visibilities, gemstoneRows, jewelryRows, items] = await Promise.all([
    getAllSubcultureContent(),
    getPageVisibilities([...SUBCULTURE_KEYS]),
    prisma.gemstone.findMany({
      select: { id: true, name: true, market: true, caratWeight: true, mineral: { select: { name: true } }, cut: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.jewelryPiece.findMany({
      select: { id: true, name: true, market: true, pieceType: true, metalType: true, metalPurity: true },
      orderBy: { name: "asc" },
    }),
    getCollectionItems(),
  ]);

  // Each item is tagged with its store: a collection page shows a visitor only
  // the items of their own storefront, so the same collection can hold
  // international items (shown on the main site) and Sri Lanka items (on /lk).
  const storeTag = (market: string) => (market === "lk" ? " [Sri Lanka]" : " [International]");
  const gemstones = gemstoneRows.map((g) => ({ id: g.id, name: g.name + storeTag(g.market), specs: `${g.caratWeight}ct ${g.mineral.name}, ${g.cut.name}` }));
  const jewelry = jewelryRows.map((j) => ({
    id: j.id,
    name: j.name + storeTag(j.market),
    specs: `${pieceTypeLabel(j.pieceType)}, ${metalTypeLabel(j.metalType)}${j.metalPurity ? ` ${j.metalPurity}` : ""}`,
  }));

  const itemsByCollection = Object.fromEntries(SUBCULTURE_KEYS.map((key) => [key, [] as { id: string; label: string; featured: boolean }[]])) as Record<
    SubcultureKey,
    { id: string; label: string; featured: boolean }[]
  >;
  for (const item of items) {
    const key = item.collection as SubcultureKey;
    if (!itemsByCollection[key]) continue; // ignore any row whose collection key no longer exists
    itemsByCollection[key].push({ id: item.id, label: collectionItemLabel(item), featured: item.featured });
  }

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Alternative Collections</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Five hidden, subculture-themed landing pages — Goth, Vampire/Gothic Fantasy, Dark Academia, Metal/Rock, and
        Witchy/Occult. None of these appear in the main site navigation; each is reachable only at its own
        /collections/&lt;slug&gt; URL once switched Live below.
      </p>

      <div className="mt-8">
        <SubcultureContentForm
          contentByCollection={contentByCollection}
          visibilityByCollection={visibilities as Record<SubcultureKey, "HIDDEN" | "COMING_SOON" | "LIVE">}
          gemstones={gemstones}
          jewelry={jewelry}
          itemsByCollection={itemsByCollection}
        />
      </div>
    </div>
  );
}
