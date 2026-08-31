import { prisma } from "@/lib/prisma";

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
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  heroSlides: [
    { src: "/images/hero/03-sapphire-diamond-ring.jpg", alt: "Oval blue sapphire ring with diamond halo" },
    { src: "/images/hero/01-loose-ruby-crystals.jpg", alt: "Raw ruby crystals on a dark surface" },
    { src: "/images/hero/05-diamond-emerald-necklace.jpg", alt: "Diamond necklace with emerald floral pendant" },
    { src: "/images/hero/02-raw-emerald-crystal.jpg", alt: "Raw emerald crystal, macro shot" },
    { src: "/images/hero/04-gemstone-ring-on-hand.jpg", alt: "Pear-cut blue gemstone ring worn on hand" },
    { src: "/images/hero/06-loose-diamonds-arrangement.jpg", alt: "Loose round-cut diamonds arranged in a cluster" },
  ],
  heroKicker: "Ceylon Gemstones & Fine Jewelry",
  heroHeadingLine1: "Colour, cut, and",
  heroHeadingLine2: "provenance —",
  heroHeadingHighlight: "designed by you.",
  heroSubtext:
    "Explore ethically sourced Ceylon sapphires, rubies, and rare gems. Configure your own stone in real time, then request a private quote from our gemologists.",
  heritageImage: "/images/heritage/ratnapura-sapphire-twin-crystal.jpg",
  heritageKicker: "Heritage",
  heritageHeading: "Two thousand years of Ceylon gems",
  heritageBody:
    "Sri Lanka's gem gravels have produced some of history's most celebrated sapphires and rubies for over two millennia. Ratnavue is built around that legacy — every gem is honestly graded, and treatment status is always disclosed.",
  sourcingImage: "/images/heritage/sri-lanka-gem-trays.jpg",
  sourcingKicker: "Sourcing",
  sourcingHeading: "Can't find the exact stone?",
  sourcingBody: "Tell us what you're looking for and our sourcing team will search Sri Lanka's gem markets on your behalf.",
  editorialQuote: "Every stone carries two thousand years of Ceylon's gem-bearing earth — we simply",
  editorialQuoteHighlight: "reveal what was already there.",
  editorialAttribution: "Ratnavue Gemological House",
  closingKicker: "Design Your Gem",
  closingHeading: "Begin with a colour in mind.",
  closingBody: "Mineral, cut, size, tone, and clarity — configured live, quoted privately.",
};

export interface AboutContent {
  heroImage: string;
  heroKicker: string;
  heroHeading: string;
  introLabel: string;
  introLead: string;
  introBody1: string;
  introBody2: string;
  breakImage: string;
  breakCaptionKicker: string;
  breakCaptionBody: string;
  quote: string;
  quoteHighlight: string;
  principle1Title: string;
  principle1Body: string;
  principle2Title: string;
  principle2Body: string;
  principle3Title: string;
  principle3Body: string;
  ctaHeading: string;
  ctaBody: string;
}

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  heroImage: "/images/hero/02-raw-emerald-crystal.jpg",
  heroKicker: "Our Story",
  heroHeading: "A colour-first approach to Ceylon gems",
  introLabel: "The Island",
  introLead: "Sri Lanka — Ceylon — has yielded some of the world's finest gemstones for over two thousand years.",
  introBody1:
    "The island's gem-bearing gravels, known locally as illam, have produced sapphires and rubies coveted by royal courts from Rome to the Mughal empire. That legacy is still being pulled from the earth today, stone by stone, largely by hand.",
  introBody2:
    "Ratnavue is built around that heritage: every gemstone is meant to be honestly graded and clearly disclosed, cut to standards that respect its natural character rather than force it into a trend.",
  breakImage: "/images/heritage/ratnapura-sapphire-twin-crystal.jpg",
  breakCaptionKicker: "Rough to reveal",
  breakCaptionBody: "A raw sapphire crystal, as it comes out of the earth — every facet still to be discovered by the cutter's hand.",
  quote: "The stone should always come",
  quoteHighlight: "first.",
  principle1Title: "Honest grading",
  principle1Body:
    "Every gemstone is graded on its own merits and described plainly — no inflated clarity claims, no vague colour names standing in for the real hue.",
  principle2Title: "Treatment disclosed",
  principle2Body:
    "Heated, unheated, or otherwise — treatment status is stated on every listing, and unheated stones are identified prominently, not buried in fine print.",
  principle3Title: "Stone-first design",
  principle3Body:
    "Jewelry here is designed around the gemstone rather than the other way around — the setting exists to let the stone speak, not to compete with it.",
  ctaHeading: "See it for yourself.",
  ctaBody: "Browse the current collection, or tell us what you're looking for and our sourcing team will go find it.",
};

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
