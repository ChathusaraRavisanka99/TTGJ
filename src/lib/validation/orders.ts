import { z } from "zod";

export const shipOrderSchema = z.object({
  carrier: z.string().min(1, "Enter a carrier").max(100),
  trackingNumber: z.string().min(1, "Enter a tracking number").max(100),
  trackingUrl: z.string().url("Enter a valid URL").max(500).optional().or(z.literal("")),
});

export type ShipOrderInput = z.infer<typeof shipOrderSchema>;

const manualSaleItemSchema = z
  .object({
    gemstoneId: z.string().optional(),
    jewelryId: z.string().optional(),
    jewelryVariantId: z.string().optional(),
    unitPrice: z.coerce.number().min(0).max(10_000_000),
  })
  .refine((i) => !!i.gemstoneId || !!i.jewelryId, { message: "Every line needs a gemstone or jewelry item." });

// `items` arrives as a JSON-encoded string (the form builds a dynamic list
// client-side — see ManualSaleForm) rather than individual FormData fields.
export const manualSaleSchema = z.object({
  customerUserId: z.string().min(1, "Select a customer"),
  market: z.enum(["intl", "lk"]),
  items: z.preprocess((v) => {
    if (typeof v !== "string") return v;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }, z.array(manualSaleItemSchema).min(1, "Add at least one item")),
  paymentMethod: z.enum(["CASH", "WIRE_TRANSFER"]),
  paymentReference: z.string().max(200).optional().or(z.literal("")),
});

export type ManualSaleInput = z.infer<typeof manualSaleSchema>;
