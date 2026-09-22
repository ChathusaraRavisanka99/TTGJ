import { z } from "zod";

// Retail checkout's shipping fields (src/actions/checkout.ts) — previously
// only checked for "non-empty after trim", with no length caps, unlike
// every other FormData-shaped action in this app (see catalog.ts, quote.ts
// in this same folder). These values flow into the Order row and into
// PayHere's hosted-page redirect fields, so an unbounded string was never
// exploitable (Prisma parameterizes, and PayHere's fields are URL-encoded)
// but was still an inconsistency worth closing.
export const shippingSchema = z.object({
  firstName: z.string().min(1, "Enter your first name").max(100),
  lastName: z.string().min(1, "Enter your last name").max(100),
  phone: z.string().min(1, "Enter a phone number").max(30),
  address: z.string().min(1, "Enter your address").max(200),
  city: z.string().min(1, "Enter your city").max(100),
  country: z.string().min(1, "Enter your country").max(100),
});

export type ShippingInput = z.infer<typeof shippingSchema>;
