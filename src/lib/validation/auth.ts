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
    agreedToTerms: z.preprocess((v) => v === "true" || v === true, z.boolean()),
  })
  .superRefine((data, ctx) => {
    if (!data.agreedToTerms) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please agree to the Terms & Conditions to continue.", path: ["agreedToTerms"] });
    }
    if (data.customerType !== "WHOLESALE") return;
    if (!data.businessName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Business name is required for a wholesale account", path: ["businessName"] });
    }
    if (!data.businessRegNo?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Business registration number is required for a wholesale account", path: ["businessRegNo"] });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

// Same minimum-length rule as registerSchema's password field — the two
// should never drift apart, since a reset is just choosing a password the
// same way registration does.
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Missing reset token"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Same minimum-length rule as registerSchema's password field.
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// An admin creating a wholesale account directly, with a predefined
// password the customer is expected to change (see mustChangePassword on
// User) — business name/reg no are required the same way a self-registered
// wholesale signup requires them.
export const createWholesaleAccountSchema = z.object({
  name: z.string().min(2, "Please enter a full name").max(100),
  email: z.string().email("Enter a valid email address"),
  temporaryPassword: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().min(1, "Business name is required").max(150),
  businessRegNo: z.string().min(1, "Business registration number is required").max(100),
});

// An admin creating a restricted back-office (STAFF) account — same
// predefined-password/mustChangePassword convention as the wholesale
// account above. marketScope decides which store's orders they can see
// and act on (see User.staffMarketScope's own schema comment).
export const createStaffAccountSchema = z.object({
  name: z.string().min(2, "Please enter a full name").max(100),
  email: z.string().email("Enter a valid email address"),
  temporaryPassword: z.string().min(8, "Password must be at least 8 characters"),
  marketScope: z.enum(["intl", "lk", "both"]),
});
