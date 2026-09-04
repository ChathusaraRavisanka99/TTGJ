import { prisma } from "@/lib/prisma";
import { SEASONAL_THEME_KEYS, type SeasonalThemeKey } from "@/lib/seasonal-themes";

// Marketing copy/images for the Home and About pages, editable by admins at
// /admin/content/{home,about}. Deliberately NOT the product catalog — item
// data (gemstones/jewelry) stays in its own tables and admin screens.
//
// Stored as one loosely-typed JSON blob per page (see PageContent in
// schema.prisma) rather than rigid columns, so this shape can grow without a
// migration. `getPageContent` merges whatever's saved over the defaults
// below, so a field added here later is still safely defaulted for pages
// nobody has edited yet (or that predate the field).

export interface HeroSlide {
  src: string;
  alt: string;
  // Horizontal focal point, 0-100 (percent from the left), used as the
  // image's object-position when object-cover crops it — undefined means
  // 50 (centered). Matters far more than it would look like at a glance:
  // every hero photo here is a very wide ~2.23:1 crop, and the hero itself
  // is object-cover'd into a much taller box on a phone (h-dvh at a
  // portrait aspect ratio), so mobile ends up showing only roughly the
  // middle quarter of the image's width. A subject that isn't near
  // dead-center in the original photo — see 03-sapphire-diamond-ring.jpg,
  // centered around 65% — gets cropped almost entirely out of frame on a
  // phone even though it looks fine on a wide desktop viewport, where the
  // crop is far less aggressive to begin with.
  focusX?: number;
}

export interface HomeContent {
  heroSlides: HeroSlide[];
  heroKicker: string;
  heroHeadingLine1: string;
  heroHeadingLine2: string;
  heroHeadingHighlight: string;
  heroSubtext: string;
  heritageImage: string;
  heritageKicker: string;
  heritageHeading: string;
  heritageBody: string;
  sourcingImage: string;
  sourcingKicker: string;
  sourcingHeading: string;
  sourcingBody: string;
  editorialQuote: string;
  editorialQuoteHighlight: string;
  editorialAttribution: string;
  closingKicker: string;
  closingHeading: string;
  closingBody: string;
  // Independent on/off switches for the two curated sections — the items
  // themselves are picked separately (Gemstone.isFeatured /
  // JewelryPiece.isFeatured, toggled from their admin list pages). A
  // section only actually renders when its switch is on AND at least one
  // item has been marked featured.
  showFeaturedGems: boolean;
  showFeaturedJewelry: boolean;
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  // focusX values measured directly against each source photo (all a
  // very wide ~1905x855, 2.23:1 crop) — see HeroSlide.focusX. Most
  // subjects sit close enough to center that the default (50, omitted
  // below) is fine; 03's ring is the one that's dramatically off-center.
  heroSlides: [
    { src: "/images/hero/03-sapphire-diamond-ring.jpg", alt: "Oval blue sapphire ring with diamond halo", focusX: 70 },
    { src: "/images/hero/01-loose-ruby-crystals.jpg", alt: "Raw ruby crystals on a dark surface", focusX: 46 },
    { src: "/images/hero/05-diamond-emerald-necklace.jpg", alt: "Diamond necklace with emerald floral pendant" },
    { src: "/images/hero/02-raw-emerald-crystal.jpg", alt: "Raw emerald crystal, macro shot", focusX: 43 },
    { src: "/images/hero/04-gemstone-ring-on-hand.jpg", alt: "Pear-cut blue gemstone ring worn on hand" },
    { src: "/images/hero/06-loose-diamonds-arrangement.jpg", alt: "Loose round-cut diamonds arranged in a cluster", focusX: 45 },
  ],
  heroKicker: "Ceylon Gemstones & Fine Jewelry",
  heroHeadingLine1: "Colour, cut, and",
  heroHeadingLine2: "provenance —",
  heroHeadingHighlight: "chosen by you, sourced by us.",
  heroSubtext:
    "Explore ethically sourced Ceylon sapphires, rubies, and rare colour stones — each one honestly graded and clearly disclosed. Configure your own stone in real time, then request a private quote from our gemologists.",
  heritageImage: "/images/heritage/blue-crystal-macro.jpg",
  heritageKicker: "Heritage",
  heritageHeading: "Two thousand years of Ceylon gems",
  heritageBody:
    "Sri Lanka's gem gravels — illam, as they're known locally — have produced some of history's most celebrated sapphires and rubies for over two millennia, pulled from the same riverbeds that once supplied ancient trading ports. Ratnavue is built around that legacy: every gem is honestly graded, and treatment status is always disclosed.",
  sourcingImage: "/images/heritage/gemologist-sorting-emeralds.jpg",
  sourcingKicker: "Sourcing",
  sourcingHeading: "Can't find the exact stone?",
  sourcingBody:
    "Tell us the mineral, size, cut, or colour you have in mind, and our sourcing team will search Sri Lanka's gem markets on your behalf — no obligation until you see what we find.",
  editorialQuote: "Every stone carries two thousand years of Ceylon's gem-bearing earth — we simply",
  editorialQuoteHighlight: "reveal what was already there.",
  editorialAttribution: "Ratnavue Gemological House",
  closingKicker: "Design Your Gem",
  closingHeading: "Begin with a colour in mind.",
  closingBody: "Mineral, cut, size, tone, and clarity — configured live, quoted privately.",
  showFeaturedGems: true,
  showFeaturedJewelry: true,
};

// Shown to a customer on /account/cart once they submit it, and reused
// as-is on the printed CartInvoice — a plain admin-editable paragraph
// rather than structured bank-detail fields, since exactly what to say
// (which bank, which currency, whether it varies by amount) is entirely
// up to the business and not this app's concern to model.
export interface CartContent {
  wireTransferInstructions: string;
}

export const DEFAULT_CART_CONTENT: CartContent = {
  wireTransferInstructions:
    "Wire transfer details have not been set up yet — an admin needs to add them in Cart Settings before a customer can complete payment.",
};

// The dedicated seasonal promotions page (/promotions) — editable at
// /admin/promotions. Visibility (hidden/coming-soon/live) is tracked
// separately via PageVisibility (key "seasonal"), not here — this is
// just what to say and how to look once it's on.
//
// Each of the 5 themes carries its own kicker/heading/body/button, not
// one shared set of copy that happens to get restyled — "Shop the
// Collection" reads fine in autumn, not so much announcing a Halloween
// edit. Every theme's copy comes predefined (see
// DEFAULT_SEASONAL_THEME_COPY) and every one is independently editable;
// `activeTheme` just picks which one is currently live on the page,
// same as swapping a slide, not which one exists.
export interface SeasonalThemeCopy {
  kicker: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface SeasonalContent {
  activeTheme: SeasonalThemeKey;
  themes: Record<SeasonalThemeKey, SeasonalThemeCopy>;
}

export const DEFAULT_SEASONAL_THEME_COPY: Record<SeasonalThemeKey, SeasonalThemeCopy> = {
  spring: {
    kicker: "New Arrivals",
    heading: "Bloom Into the Season",
    body: "Fresh cuts and soft hues, arriving as the season turns — browse the spring edit while it lasts.",
    ctaLabel: "Shop Spring Arrivals",
    ctaHref: "/gems",
  },
  summer: {
    kicker: "Summer Radiance",
    heading: "Sunlit Stones, Ready to Wear",
    body: "Bright sapphires and warm gold, made for long summer evenings — a curated edit, here for a limited time.",
    ctaLabel: "Shop the Summer Edit",
    ctaHref: "/gems",
  },
  autumn: {
    kicker: "Limited Time",
    heading: "A Season of Colour",
    body: "Hand-selected Ceylon gemstones and jewelry, curated for the season — browse the collection while it's here.",
    ctaLabel: "Shop the Collection",
    ctaHref: "/gems",
  },
  winter: {
    kicker: "Winter Edit",
    heading: "Gifts Worth Giving",
    body: "Cool blues and icy brilliance for the season ahead — a curated selection, ready for gifting.",
    ctaLabel: "Shop Winter Gifts",
    ctaHref: "/gems",
  },
  halloween: {
    kicker: "Something Wicked",
    heading: "A Darker Kind of Sparkle",
    body: "Deep reds, smoky stones, and after-dark elegance — a limited Halloween edit, here through the season.",
    ctaLabel: "Shop the Halloween Edit",
    ctaHref: "/gems",
  },
};

export const DEFAULT_SEASONAL_CONTENT: SeasonalContent = {
  activeTheme: "autumn",
  themes: DEFAULT_SEASONAL_THEME_COPY,
};

// getPageContent's shallow merge (below) is right for flat fields but
// wrong for `themes`: a saved row's `themes` would replace the whole
// defaults object, not merge key-by-key — a theme nobody's edited yet
// would lose its predefined copy entirely instead of falling back to it.
// This does that merge per-theme, so every theme is always fully
// populated: predefined, then overridden per-field by whatever's saved.
export async function getSeasonalContent(): Promise<SeasonalContent> {
  const saved = await getPageContent<Partial<SeasonalContent>>("seasonal", {});
  const themes = Object.fromEntries(
    SEASONAL_THEME_KEYS.map((key) => [key, { ...DEFAULT_SEASONAL_THEME_COPY[key], ...saved.themes?.[key] }]),
  ) as Record<SeasonalThemeKey, SeasonalThemeCopy>;
  return { activeTheme: saved.activeTheme ?? DEFAULT_SEASONAL_CONTENT.activeTheme, themes };
}

// The About page moved to a block-based drag-and-drop CMS builder — its
// content shape (AboutContent = { blocks: AboutBlock[] }) and defaults now
// live in about-blocks.ts, re-exported here so callers only need one import
// path for either page's content.
export type { AboutContent } from "@/lib/about-blocks";
export { DEFAULT_ABOUT_CONTENT } from "@/lib/about-blocks";

export async function getPageContent<T extends object>(page: string, defaults: T): Promise<T> {
  const row = await prisma.pageContent.findUnique({ where: { page } });
  if (!row || typeof row.data !== "object" || row.data === null) return defaults;
  return { ...defaults, ...(row.data as Partial<T>) };
}

export async function savePageContent(page: string, data: object): Promise<void> {
  await prisma.pageContent.upsert({
    where: { page },
    update: { data: data as never },
    create: { page, data: data as never },
  });
}
