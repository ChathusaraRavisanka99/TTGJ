import { z } from "zod";

export const refundRequestSchema = z.object({
  reason: z.enum(["DAMAGED", "NOT_AS_DESCRIBED", "CHANGED_MIND", "WRONG_ITEM", "OTHER"]),
  reasonNotes: z.string().max(2000).optional().or(z.literal("")),
});

export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

const optionalAmount = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.number().min(0).max(1_000_000_000).optional(),
);

export const resolveRefundSchema = z.object({
  resolution: z.enum(["FULL", "MINUS_SHIPPING", "PARTIAL"]),
  customAmount: optionalAmount,
  restock: z.preprocess((v) => v === "true" || v === true, z.boolean()).default(false),
  adminNotes: z.string().max(2000).optional().or(z.literal("")),
});

export type ResolveRefundInput = z.infer<typeof resolveRefundSchema>;
