import { z } from "zod";

export const gemstoneSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(4000).optional().or(z.literal("")),
  mineralId: z.string().min(1, "Select a mineral"),
  variety: z.string().max(100).optional().or(z.literal("")),
  cutId: z.string().min(1, "Select a cut"),
  caratWeight: z.coerce.number().min(0.01).max(500),
  lengthMm: z.coerce.number().min(0).max(200).optional(),
  widthMm: z.coerce.number().min(0).max(200).optional(),
  depthMm: z.coerce.number().min(0).max(200).optional(),
  colorHue: z.coerce.number().min(0).max(360),
  colorSaturation: z.coerce.number().min(0).max(100).default(72),
  colorLightness: z.coerce.number().min(0).max(100).default(50),
  colorLabel: z.string().max(100).optional().or(z.literal("")),
  clarityGradeId: z.string().min(1, "Select a clarity grade"),
  treatmentId: z.string().min(1, "Select a treatment"),
  originId: z.string().min(1, "Select an origin"),
  symmetryNotes: z.string().max(500).optional().or(z.literal("")),
  polishNotes: z.string().max(500).optional().or(z.literal("")),
  certLabId: z.string().optional().or(z.literal("")),
  certReportNumber: z.string().max(100).optional().or(z.literal("")),
  certFileUrl: z.string().max(500).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(10_000_000).optional(),
  showPrice: z.coerce.boolean().default(false),
  stockStatus: z.enum(["AVAILABLE", "RESERVED", "SOLD"]).default("AVAILABLE"),
  isPublished: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
});

export type GemstoneInput = z.infer<typeof gemstoneSchema>;

export const jewelrySchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(4000).optional().or(z.literal("")),
  pieceType: z.enum(["RING", "NECKLACE", "EARRINGS", "BRACELET", "PENDANT", "BROOCH", "OTHER"]),
  metalType: z.enum(["GOLD", "WHITE_GOLD", "ROSE_GOLD", "PLATINUM", "SILVER"]),
  metalPurity: z.string().max(30).optional().or(z.literal("")),
  metalWeightG: z.coerce.number().min(0).max(2000).optional(),
  ringSize: z.string().max(20).optional().or(z.literal("")),
  styleTags: z.string().max(300).optional().or(z.literal("")), // comma-separated in the form
  price: z.coerce.number().min(0).max(10_000_000).optional(),
  showPrice: z.coerce.boolean().default(false),
  stockStatus: z.enum(["AVAILABLE", "RESERVED", "SOLD"]).default("AVAILABLE"),
  isPublished: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
});

export type JewelryInput = z.infer<typeof jewelrySchema>;

export const mineralSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  hueMin: z.coerce.number().min(0).max(360),
  hueMax: z.coerce.number().min(0).max(360),
  active: z.coerce.boolean().default(true),
});

export const clarityGradeSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(2).max(300),
  sortOrder: z.coerce.number().min(0).max(100).default(0),
  active: z.coerce.boolean().default(true),
});

export const simpleMasterDataSchema = z.object({
  name: z.string().min(2).max(100),
  active: z.coerce.boolean().default(true),
});

export const certLabSchema = z.object({
  name: z.string().min(2).max(100),
  // The lab's general website (e.g. a homepage link on its logo badge) —
  // separate from verifyUrlTemplate below, which is a specific per-report
  // lookup URL, not every lab has one, and this one doesn't need {certId}.
  websiteUrl: z.string().max(500).url("Enter a full URL, e.g. https://www.gia.edu").optional().or(z.literal("")),
  // Must contain the literal token `{certId}` if present — checked so a
  // template without it (which would silently produce a broken link for
  // every gem) is rejected at save time instead of at render time.
  verifyUrlTemplate: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || v.includes("{certId}"), {
      message: "The verification URL must contain the {certId} placeholder.",
    }),
  active: z.coerce.boolean().default(true),
});
