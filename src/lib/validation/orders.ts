import { z } from "zod";

export const shipOrderSchema = z.object({
  carrier: z.string().min(1, "Enter a carrier").max(100),
  trackingNumber: z.string().min(1, "Enter a tracking number").max(100),
  trackingUrl: z.string().url("Enter a valid URL").max(500).optional().or(z.literal("")),
});

export type ShipOrderInput = z.infer<typeof shipOrderSchema>;
