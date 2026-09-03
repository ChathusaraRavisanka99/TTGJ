import { z } from "zod";

// Block-based content model for the About page's drag-and-drop CMS builder
// (/admin/content/about). The page is a list of ROWS; each row holds one or
// more COLUMNS side-by-side (a 12-unit grid, like a normal page-builder),
// and each column holds one block. A row with a single full-width (span 12)
// column is the common case and renders its block exactly as a standalone
// section (full-bleed hero/quote included); a row with 2+ columns renders
// them side-by-side inside a shared contained wrapper, with each block using
// a more compact "boxed" rendering (see AboutBlocksRenderer) sized to fit
// whatever width its column ends up with.
//
// Both the live page and the admin's live-preview pane share
// AboutBlocksRenderer, so the two can never drift apart.

export interface HeroBlock {
  id: string;
  type: "hero";
  image: string;
  kicker: string;
  heading: string;
}

export interface TextBlock {
  id: string;
  type: "text";
  label: string;
  lead: string;
  body1: string;
  body2: string;
}

export interface ImageCaptionBlock {
  id: string;
  type: "imageCaption";
  image: string;
  kicker: string;
  body: string;
}

export interface QuoteBlock {
  id: string;
  type: "quote";
  text: string;
  highlight: string;
}

export interface PrinciplesBlock {
  id: string;
  type: "principles";
  items: { title: string; body: string }[];
}

export interface ImageBlock {
  id: string;
  type: "image";
  image: string;
  caption: string;
}

export interface CtaBlock {
  id: string;
  type: "cta";
  heading: string;
  body: string;
}

// Empty vertical space, filled with the page's base background colour (not
// transparent) so it reliably blends in wherever it's placed — including
// between two sections that don't share a colour — rather than showing
// through to whatever happens to sit behind it.
export type SpacerHeight = "sm" | "md" | "lg" | "xl";

export interface SpacerBlock {
  id: string;
  type: "spacer";
  height: SpacerHeight;
}

export type AboutBlock =
  | HeroBlock
  | TextBlock
  | ImageCaptionBlock
  | QuoteBlock
  | PrinciplesBlock
  | ImageBlock
  | CtaBlock
  | SpacerBlock;

// A column's width, in twelfths of its row — the same 12-unit convention as
// Bootstrap/most grid systems. Rows aren't required to sum to 12; a row
// under 12 just leaves trailing space, and a row over 12 wraps to a second
// line — the builder shows a running total but doesn't block either.
export type ColumnSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const SPAN_PRESETS: { span: ColumnSpan; label: string }[] = [
  { span: 12, label: "Full width" },
  { span: 9, label: "Three-quarters" },
  { span: 8, label: "Two-thirds" },
  { span: 6, label: "Half" },
  { span: 4, label: "Third" },
  { span: 3, label: "Quarter" },
];

export interface AboutColumn {
  id: string;
  span: ColumnSpan;
  block: AboutBlock;
}

export interface AboutRow {
  id: string;
  columns: AboutColumn[];
}

export interface AboutContent {
  rows: AboutRow[];
}

// Metadata driving the admin builder's "Add block" menus (both "add row"
// and "add column") and default content for a freshly-added block of each
// type — kept next to the types so a new block type only needs to be
// registered in one place.
export const BLOCK_TYPES: {
  type: AboutBlock["type"];
  label: string;
  description: string;
  create: (id: string) => AboutBlock;
}[] = [
  {
    type: "hero",
    label: "Hero banner",
    description: "Full-screen image with a kicker and large heading.",
    create: (id) => ({ id, type: "hero", image: "/images/hero/02-raw-emerald-crystal.jpg", kicker: "Kicker text", heading: "A new heading" }),
  },
  {
    type: "text",
    label: "Text",
    description: "A label, a lead sentence, and supporting paragraphs.",
    create: (id) => ({ id, type: "text", label: "Label", lead: "A lead sentence introducing this section.", body1: "First supporting paragraph.", body2: "Second supporting paragraph." }),
  },
  {
    type: "imageCaption",
    label: "Image + caption",
    description: "A photo with a short kicker and caption.",
    create: (id) => ({ id, type: "imageCaption", image: "/images/hero/01-loose-ruby-crystals.jpg", kicker: "Kicker text", body: "A short caption for this image." }),
  },
  {
    type: "image",
    label: "Full-width image",
    description: "A standalone photo with an optional centered caption.",
    create: (id) => ({ id, type: "image", image: "/images/hero/02-raw-emerald-crystal.jpg", caption: "" }),
  },
  {
    type: "quote",
    label: "Pull quote",
    description: "A statement, with the ending highlighted in gold.",
    create: (id) => ({ id, type: "quote", text: "A memorable line goes here", highlight: "ending." }),
  },
  {
    type: "principles",
    label: "Principles grid",
    description: "A row of numbered title + body items.",
    create: (id) => ({ id, type: "principles", items: [
      { title: "First principle", body: "A short description of this principle." },
      { title: "Second principle", body: "A short description of this principle." },
      { title: "Third principle", body: "A short description of this principle." },
    ] }),
  },
  {
    type: "cta",
    label: "Closing CTA",
    description: "A centered heading, body text, and the Shop/Sourcing buttons.",
    create: (id) => ({ id, type: "cta", heading: "A closing heading.", body: "A short closing sentence." }),
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "Empty vertical space — matches the page background, no visible line.",
    create: (id) => ({ id, type: "spacer", height: "md" }),
  },
];

function soloRow(id: string, block: AboutBlock): AboutRow {
  return { id: `${id}-row`, columns: [{ id: `${id}-col`, span: 12, block }] };
}

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  rows: [
    soloRow("hero-1", {
      id: "hero-1",
      type: "hero",
      image: "/images/hero/02-raw-emerald-crystal.jpg",
      kicker: "Our Story",
      heading: "A colour-first approach to Ceylon gems",
    }),
    soloRow("text-1", {
      id: "text-1",
      type: "text",
      label: "The Island",
      lead: "Sri Lanka — Ceylon, as gem traders have called it for two thousand years — has yielded some of the world's finest sapphires, rubies, and colour stones.",
      body1: "The island's gem-bearing gravels, known locally as illam, have produced sapphires and rubies coveted by royal courts from Rome to the Mughal empire — Marco Polo wrote of the King of Ceylon's ruby, and gem traders have followed the same river gravels around Ratnapura, the island's 'City of Gems,' ever since. That legacy is still being pulled from the earth today, largely by hand, one stone at a time.",
      body2: "Ratnavue is built around that heritage: every gemstone is meant to be honestly graded and clearly disclosed, cut to standards that respect its natural character rather than force it into a trend we'll have moved past in a decade.",
    }),
    soloRow("imageCaption-1", {
      id: "imageCaption-1",
      type: "imageCaption",
      image: "/images/hero/01-loose-ruby-crystals.jpg",
      kicker: "Rough to reveal",
      body: "Raw ruby crystals, fresh from Sri Lanka's gem gravels — every facet still to be discovered by the cutter's hand, every stone still holding its true colour until the first cut reveals it.",
    }),
    soloRow("quote-1", {
      id: "quote-1",
      type: "quote",
      text: "The stone should always come",
      highlight: "first.",
    }),
    soloRow("principles-1", {
      id: "principles-1",
      type: "principles",
      items: [
        {
          title: "Honest grading",
          body: "Every gemstone is graded on its own merits and described in plain language — no inflated clarity claims, no vague colour names standing in for the real hue.",
        },
        {
          title: "Treatment disclosed",
          body: "Heated, unheated, or otherwise — treatment status is stated on every listing in the same breath as the price, and unheated stones are identified prominently, never buried in fine print.",
        },
        {
          title: "Stone-first design",
          body: "Jewelry here is designed around the gemstone rather than the other way around — the setting exists to hold the stone securely and let it speak, not to compete with it.",
        },
      ],
    }),
    soloRow("cta-1", {
      id: "cta-1",
      type: "cta",
      heading: "Come see the collection.",
      body: "Browse the current collection, or tell us exactly what you're picturing and let our sourcing team go find it in Sri Lanka's gem markets on your behalf.",
    }),
  ],
};

const heroBlockSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("hero"),
  image: z.string().min(1).max(500),
  kicker: z.string().max(200),
  heading: z.string().max(300),
});

const textBlockSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("text"),
  label: z.string().max(100),
  lead: z.string().max(500),
  body1: z.string().max(2000),
  body2: z.string().max(2000),
});

const imageCaptionBlockSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("imageCaption"),
  image: z.string().min(1).max(500),
  kicker: z.string().max(100),
  body: z.string().max(500),
});

const quoteBlockSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("quote"),
  text: z.string().max(300),
  highlight: z.string().max(100),
});

const principlesBlockSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("principles"),
  items: z
    .array(z.object({ title: z.string().max(100), body: z.string().max(600) }))
    .min(1)
    .max(6),
});

const imageBlockSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("image"),
  image: z.string().min(1).max(500),
  caption: z.string().max(300),
});

const ctaBlockSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("cta"),
  heading: z.string().max(200),
  body: z.string().max(500),
});

const spacerBlockSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.literal("spacer"),
  height: z.enum(["sm", "md", "lg", "xl"]),
});

export const aboutBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  textBlockSchema,
  imageCaptionBlockSchema,
  quoteBlockSchema,
  principlesBlockSchema,
  imageBlockSchema,
  ctaBlockSchema,
  spacerBlockSchema,
]);

const spanSchema = z.union([
  z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6),
  z.literal(7), z.literal(8), z.literal(9), z.literal(10), z.literal(11), z.literal(12),
]);

const aboutColumnSchema = z.object({
  id: z.string().min(1).max(64),
  span: spanSchema,
  block: aboutBlockSchema,
});

const aboutRowSchema = z.object({
  id: z.string().min(1).max(64),
  columns: z.array(aboutColumnSchema).min(1).max(4),
});

export const aboutRowsSchema = z.array(aboutRowSchema).min(1).max(40);
