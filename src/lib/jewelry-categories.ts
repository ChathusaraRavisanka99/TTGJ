// The jewelry catalog's two-level structure: WHO a piece is for (audience),
// then WHAT it is (piece type). Edge/client-safe (no Prisma).

export const JEWELRY_AUDIENCES = ["women", "men", "couple", "unisex"] as const;
export type JewelryAudienceSlug = (typeof JEWELRY_AUDIENCES)[number];

export const AUDIENCE_LABELS: Record<JewelryAudienceSlug, string> = {
  women: "Women",
  men: "Men",
  couple: "Couple",
  unisex: "Unisex",
};

export type JewelryAudienceValue = "WOMEN" | "MEN" | "COUPLE" | "UNISEX";

export function isAudienceSlug(value: string | undefined | null): value is JewelryAudienceSlug {
  return !!value && (JEWELRY_AUDIENCES as readonly string[]).includes(value);
}

export function audienceValueOf(slug: JewelryAudienceSlug): JewelryAudienceValue {
  return slug.toUpperCase() as JewelryAudienceValue;
}

/** Which stored audience values a shopper browsing `slug` should see. A
 * unisex piece suits anyone, so Men and Women include it; Couple and Unisex
 * are exact. */
export function audienceValuesFor(slug: JewelryAudienceSlug): JewelryAudienceValue[] {
  if (slug === "women") return ["WOMEN", "UNISEX"];
  if (slug === "men") return ["MEN", "UNISEX"];
  if (slug === "couple") return ["COUPLE"];
  return ["UNISEX"];
}

// Display order: the pieces people shop for most first.
export const PIECE_TYPE_ORDER = ["RING", "PENDANT", "EARRINGS", "NECKLACE", "BRACELET", "ANKLET", "JEWELRY_SET", "BROOCH", "CUFFLINKS", "OTHER"] as const;

const PIECE_TYPE_LABELS: Record<string, { singular: string; plural: string }> = {
  RING: { singular: "Ring", plural: "Rings" },
  PENDANT: { singular: "Pendant", plural: "Pendants" },
  EARRINGS: { singular: "Earrings", plural: "Earrings" },
  NECKLACE: { singular: "Necklace", plural: "Necklaces" },
  BRACELET: { singular: "Bracelet", plural: "Bracelets" },
  ANKLET: { singular: "Anklet", plural: "Anklets" },
  JEWELRY_SET: { singular: "Jewelry Set", plural: "Jewelry Sets" },
  BROOCH: { singular: "Brooch", plural: "Brooches" },
  CUFFLINKS: { singular: "Cufflinks", plural: "Cufflinks" },
  OTHER: { singular: "Other", plural: "Other" },
};

export function pieceTypeLabel(value: string, form: "singular" | "plural" = "singular"): string {
  return PIECE_TYPE_LABELS[value]?.[form] ?? value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}
