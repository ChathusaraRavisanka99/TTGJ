import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Please enter your full name").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().max(30).optional().or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;
