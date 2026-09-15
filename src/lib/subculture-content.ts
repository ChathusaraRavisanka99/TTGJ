import { getPageContent, savePageContent } from "@/lib/page-content";
import { SUBCULTURE_KEYS, SUBCULTURE_COLLECTIONS, type SubcultureKey } from "@/lib/subculture-collections";

// Admin-editable copy/images for each hidden subculture landing page
// (/admin/alt-collections, public route /collections/[slug]). Split out
// from page-content.ts the same way about-blocks.ts is, and re-exported
// there — art direction (colors/fonts/decor) stays in
// subculture-collections.ts, product membership in
// SubcultureCollectionItem; this is only "what to say and which photos to
// show." One PageContent row per collection, keyed `collection:<slug>`,
// so (unlike SeasonalContent's single shared row) each collection's saved
// content can never bleed into another's.

export interface SubcultureImage {
  src: string;
  alt: string;
}

export interface SubcultureContent {
  heroKicker: string;
  heroHeading: string;
  heroSubtext: string;
  heroCtaLabel: string;
  /** Empty string = no image yet — the page falls back to its themed
   * gradient + decor (see AlternativeCollectionPage), same "graceful
   * empty state" convention GemCard's GemVisualizer fallback uses. */
  heroImage: string;
  heroImageAlt: string;
  /** Optional tighter crop for narrow viewports — falls back to
   * heroImage when unset, same idea as HomeContent's HeroSlide.focusX
   * but as a distinct asset rather than a focal point, since these hero
   * images are meant to be full-bleed portrait-friendly crops. */
  heroImageMobile: string;

  introKicker: string;
  introHeading: string;
  introBody: string;

  backgroundImage: string;
  backgroundImageAlt: string;

  bannerImages: SubcultureImage[];
  lifestyleImages: SubcultureImage[];

  crossLinkBlurb: string;

  seoTitle: string;
  seoDescription: string;
  ogImage: string;
}

const BASE_DEFAULTS: Omit<SubcultureContent, "heroKicker" | "heroHeading" | "heroSubtext" | "heroCtaLabel" | "introKicker" | "introHeading" | "introBody" | "seoTitle" | "seoDescription" | "crossLinkBlurb"> = {
  heroImage: "",
  heroImageAlt: "",
  heroImageMobile: "",
  backgroundImage: "",
  backgroundImageAlt: "",
  bannerImages: [],
  lifestyleImages: [],
  ogImage: "",
};

export const DEFAULT_SUBCULTURE_CONTENT: Record<SubcultureKey, SubcultureContent> = {
  "goth-dark-romantic": {
    ...BASE_DEFAULTS,
    heroKicker: "Goth / Dark Romantic",
    heroHeading: "Beauty in the Dark.",
    heroSubtext: "Natural gemstones crafted for those who find elegance beyond the ordinary.",
    heroCtaLabel: "Explore the Collection",
    introKicker: "Dark Romantic",
    introHeading: "Elegance, after the sun goes down.",
    introBody:
      "Black spinel, dark garnet, and deep sapphire, set in antique silver — drawn from Victorian ironwork, cathedral windows, and candlelight rather than costume. Every piece here is built the same way as the rest of the house: natural stones, honestly graded, quietly worn.",
    crossLinkBlurb: "Explore Another Side of the Dark",
    seoTitle: "Gothic & Dark Romantic Gemstone Jewelry",
    seoDescription:
      "Elegant gothic and dark romantic fine jewelry in black spinel, garnet, amethyst and onyx — natural gemstones and sterling silver, for those who find beauty after dark.",
  },
  "vampire-gothic-fantasy": {
    ...BASE_DEFAULTS,
    heroKicker: "Vampire / Gothic Fantasy",
    heroHeading: "Born After Dark.",
    heroSubtext: "Deep color. Ancient beauty. Jewelry for the night.",
    heroCtaLabel: "Enter the Collection",
    introKicker: "Gothic Fantasy",
    introHeading: "Colour with a pulse.",
    introBody:
      "Garnet and ruby red, midnight black spinel, and twilight amethyst — a darker, more cinematic edit than Goth's quiet elegance. Moonlit towers and crimson velvet inform the mood; the stones themselves are the same honestly-graded natural gems as everywhere else in the house.",
    crossLinkBlurb: "Explore Another Side of the Dark",
    seoTitle: "Vampire & Gothic Fantasy Gemstone Jewelry",
    seoDescription:
      "Dramatic vampire and gothic fantasy fine jewelry — deep garnet, ruby, black spinel and amethyst in sterling silver, for jewelry made for the night.",
  },
  "dark-academia": {
    ...BASE_DEFAULTS,
    heroKicker: "Dark Academia",
    heroHeading: "For Those Who Appreciate the Uncommon.",
    heroSubtext: "Natural gemstones, quiet luxury and timeless craftsmanship.",
    heroCtaLabel: "Browse the Collection",
    introKicker: "Quiet Luxury",
    introHeading: "A private study, not a spectacle.",
    introBody:
      "Smoky quartz, deep sapphire, and warm garnet in oval, cushion, and signet-inspired settings — understated pieces that would sit as comfortably beside a fountain pen and a leather-bound book as anywhere else. Minimal silver settings, vintage-inspired lines, nothing ornamental for its own sake.",
    crossLinkBlurb: "Explore Another Side of the Dark",
    seoTitle: "Dark Academia Gemstone Jewelry",
    seoDescription:
      "Understated dark academia fine jewelry — smoky quartz, sapphire, garnet and amethyst in signet-inspired sterling silver settings, quiet luxury and timeless craftsmanship.",
  },
  "metal-rock": {
    ...BASE_DEFAULTS,
    heroKicker: "Metal / Rock",
    heroHeading: "Wear It Loud.",
    heroSubtext: "Raw materials. Dark stones. Uncompromising character.",
    heroCtaLabel: "Shop the Arsenal",
    introKicker: "Uncompromising",
    introHeading: "Built heavier, worn harder.",
    introBody:
      "Black spinel, onyx, and hematite set in heavy silver — chunkier rings, signet shapes, and bold pendants with industrial, geometric lines. Unisex by design, powerful without tipping into costume — the same natural stones and sterling craftsmanship as the rest of the house, just built for a bigger stage.",
    crossLinkBlurb: "Explore Another Side of the Dark",
    seoTitle: "Metal & Rock Gemstone Jewelry",
    seoDescription:
      "Bold metal and rock fine jewelry — black spinel, onyx, hematite and labradorite in heavy sterling silver, chunky rings and statement pendants for men and women.",
  },
  "witchy-occult": {
    ...BASE_DEFAULTS,
    heroKicker: "Witchy / Occult",
    heroHeading: "Wear What Calls to You.",
    heroSubtext: "Natural gemstones chosen for their color, character and mystery.",
    heroCtaLabel: "Open the Grimoire",
    introKicker: "Mystic",
    introHeading: "Moon phases, quietly worn.",
    introBody:
      "Labradorite's shifting sheen, deep amethyst, grounding black spinel and warm garnet — organised by mood rather than category: Moon, Shadow, Mystic, Ember. Botanical and celestial in spirit, gemstone-first in practice — never a costume-shop occult store.",
    crossLinkBlurb: "Explore Another Side of the Dark",
    seoTitle: "Witchy & Occult Gemstone Jewelry",
    seoDescription:
      "Mystical witchy and occult fine jewelry — labradorite, amethyst, black tourmaline and garnet in sterling silver, natural gemstones chosen for color, character and mystery.",
  },
};

function contentKey(key: SubcultureKey): string {
  return `collection:${key}`;
}

export async function getSubcultureContent(key: SubcultureKey): Promise<SubcultureContent> {
  return getPageContent<SubcultureContent>(contentKey(key), DEFAULT_SUBCULTURE_CONTENT[key]);
}

export async function getAllSubcultureContent(): Promise<Record<SubcultureKey, SubcultureContent>> {
  const entries = await Promise.all(SUBCULTURE_KEYS.map(async (key) => [key, await getSubcultureContent(key)] as const));
  return Object.fromEntries(entries) as Record<SubcultureKey, SubcultureContent>;
}

export async function saveSubcultureContent(key: SubcultureKey, data: Partial<SubcultureContent>): Promise<void> {
  const current = await getSubcultureContent(key);
  await savePageContent(contentKey(key), { ...current, ...data });
}

export function subcultureLabel(key: SubcultureKey): string {
  return SUBCULTURE_COLLECTIONS[key]?.label ?? key;
}
