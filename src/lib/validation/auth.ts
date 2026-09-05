import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Please enter your full name").max(100),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phone: z.string().max(30).optional().or(z.literal("")),
    customerType: z.enum(["RETAIL", "WHOLESALE"]).default("RETAIL"),
    // Only required (and only stored) for a WHOLESALE registration — see
    // the superRefine below and registerCustomer in actions/auth.ts.
    businessName: z.string().max(150).optional().or(z.literal("")),
    businessRegNo: z.string().max(100).optional().or(z.literal("")),
    // Optional for everyone — collectible later in account settings too.
    // Used only by the birthday promotion (lib/checkout.ts).
    dateOfBirth: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.customerType !== "WHOLESALE") return;
    if (!data.businessName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Business name is required for a wholesale account", path: ["businessName"] });
    }
    if (!data.businessRegNo?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Business registration number is required for a wholesale account", path: ["businessRegNo"] });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
