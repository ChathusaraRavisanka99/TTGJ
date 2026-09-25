// The validation schemas for the About page builder — kept apart from
// about-blocks.ts so the admin builder's client bundle (which only needs that
// file's block types and defaults) doesn't ship the whole Zod library.
import { z } from "zod";

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
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Enter a hex colour like #ffffff."),
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
