import { z } from "zod";

export const configuredSpecSchema = z.object({
  mineralId: z.string(),
  mineralName: z.string(),
  cutId: z.string(),
  cutName: z.string(),
  caratWeight: z.number().min(0.1).max(50),
  hue: z.number().min(0).max(360),
  darkness: z.number().min(0).max(100),
  claritySlug: z.string(),
  clarityName: z.string(),
});

export type ConfiguredSpec = z.infer<typeof configuredSpecSchema>;

export const quoteRequestSchema = z
  .object({
    gemstoneId: z.string().optional(),
    jewelryId: z.string().optional(),
    configuredSpec: configuredSpecSchema.optional(),
    quantity: z.coerce.number().int().min(1).max(20).default(1),
    note: z.string().max(2000).optional().or(z.literal("")),
  })
  .refine((data) => data.gemstoneId || data.jewelryId || data.configuredSpec, {
    message: "A quote request must reference a product or a configured gem",
  });

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const sourcingRequestSchema = z.object({
  mineralDescription: z.string().min(2, "Tell us what mineral or gem you're after").max(200),
  approxSize: z.string().max(100).optional().or(z.literal("")),
  approxCut: z.string().max(100).optional().or(z.literal("")),
  approxColor: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type SourcingRequestInput = z.infer<typeof sourcingRequestSchema>;
