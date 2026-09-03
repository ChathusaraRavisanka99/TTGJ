import { z } from "zod";

// Block-based content model for the About page's drag-and-drop CMS builder
// (/admin/content/about). Replaces the old fixed-shape AboutContent: instead
// of one hardcoded sequence of sections, the page is just a list of blocks
// an admin can add, remove, reorder, and edit — rendered by
// AboutBlocksRenderer (src/components/about/AboutBlocksRenderer.tsx), which
// both the live page and the admin's live-preview pane share so the two can
// never drift apart.
//
// Each block carries a stable `id` (assigned once, kept for its lifetime)
// used as the React key for reordering and as the drag handle identity —
// never derived from position, since position is exactly what changes.

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

export type AboutBlock =
  | HeroBlock
  | TextBlock
  | ImageCaptionBlock
  | QuoteBlock
  | PrinciplesBlock
  | ImageBlock
  | CtaBlock;

export interface AboutContent {
  blocks: AboutBlock[];
}

// Metadata driving the admin builder's "Add block" menu and default content
// for a freshly-added block of each type — kept next to the types so a new
// block type only needs to be registered in one place.
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
    label: "Text (two column)",
    description: "A lede on the left, supporting paragraphs on the right.",
    create: (id) => ({ id, type: "text", label: "Label", lead: "A lead sentence introducing this section.", body1: "First supporting paragraph.", body2: "Second supporting paragraph." }),
  },
  {
    type: "imageCaption",
    label: "Image + caption",
    description: "A large photo with a short kicker and caption beside it.",
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
    description: "A large full-screen statement, with the ending highlighted in gold.",
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
];

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  blocks: [
    {
      id: "hero-1",
      type: "hero",
      image: "/images/hero/02-raw-emerald-crystal.jpg",
      kicker: "Our Story",
      heading: "A colour-first approach to Ceylon gems",
    },
    {
      id: "text-1",
      type: "text",
      label: "The Island",
      lead: "Sri Lanka — Ceylon, as gem traders have called it for two thousand years — has yielded some of the world's finest sapphires, rubies, and colour stones.",
      body1: "The island's gem-bearing gravels, known locally as illam, have produced sapphires and rubies coveted by royal courts from Rome to the Mughal empire — Marco Polo wrote of the King of Ceylon's ruby, and gem traders have followed the same river gravels around Ratnapura, the island's 'City of Gems,' ever since. That legacy is still being pulled from the earth today, largely by hand, one stone at a time.",
      body2: "Ratnavue is built around that heritage: every gemstone is meant to be honestly graded and clearly disclosed, cut to standards that respect its natural character rather than force it into a trend we'll have moved past in a decade.",
    },
    {
      id: "imageCaption-1",
      type: "imageCaption",
      image: "/images/hero/01-loose-ruby-crystals.jpg",
      kicker: "Rough to reveal",
      body: "Raw ruby crystals, fresh from Sri Lanka's gem gravels — every facet still to be discovered by the cutter's hand, every stone still holding its true colour until the first cut reveals it.",
    },
    {
      id: "quote-1",
      type: "quote",
      text: "The stone should always come",
      highlight: "first.",
    },
    {
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
    },
    {
      id: "cta-1",
      type: "cta",
      heading: "Come see the collection.",
      body: "Browse the current collection, or tell us exactly what you're picturing and let our sourcing team go find it in Sri Lanka's gem markets on your behalf.",
    },
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

export const aboutBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  textBlockSchema,
  imageCaptionBlockSchema,
  quoteBlockSchema,
  principlesBlockSchema,
  imageBlockSchema,
  ctaBlockSchema,
]);

export const aboutBlocksSchema = z.array(aboutBlockSchema).min(1).max(40);
