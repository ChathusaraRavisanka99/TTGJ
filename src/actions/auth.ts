"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { registerSchema } from "@/lib/validation/auth";
import { safeCallbackPath } from "@/lib/utils";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function registerCustomer(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") ?? "",
    customerType: formData.get("customerType") || "RETAIL",
    businessName: formData.get("businessName") ?? "",
    businessRegNo: formData.get("businessRegNo") ?? "",
    dateOfBirth: formData.get("dateOfBirth") ?? "",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, phone, customerType, businessName, businessRegNo, dateOfBirth } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "An account with this email already exists. Try signing in instead." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const isWholesale = customerType === "WHOLESALE";

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone: phone || undefined,
      role: "CUSTOMER",
      customerType,
      // Retail accounts are active immediately (today's behavior,
      // unchanged) — a wholesale registration instead sits PENDING until
      // an admin reviews it (see actions/wholesale.ts). Approval gates
      // nothing else in the app: a pending account can browse, quote, and
      // buy retail exactly like any other customer in the meantime.
      wholesaleStatus: isWholesale ? "PENDING" : undefined,
      businessName: isWholesale ? businessName || undefined : undefined,
      businessRegNo: isWholesale ? businessRegNo || undefined : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    },
  });

  return { ok: true };
}

export async function authenticateWithCredentials(formData: FormData): Promise<ActionResult> {
  // callbackUrl always comes from a URL query param (see login/register
  // page.tsx) — never trust it as-is. This redirect() call is Next's own,
  // not NextAuth's (redirect: false below opts out of NextAuth's built-in
  // same-origin redirect sanitization on purpose, since sign-in itself
  // reports success/failure back to the form instead of redirecting), so
  // nothing upstream is sanitizing this value unless it happens here.
  const callbackUrl = safeCallbackPath(formData.get("callbackUrl"));

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Incorrect email or password." };
    }
    throw error;
  }

  redirect(callbackUrl);
}

export async function signInWithGoogle(formData: FormData) {
  // NextAuth's own redirectTo already gets same-origin-checked by its
  // default redirect callback, but sanitizing here too means that
  // protection isn't the only thing standing between this value and a
  // redirect — consistent with authenticateWithCredentials above rather
  // than relying on two different code paths staying safe for two
  // different reasons.
  const callbackUrl = safeCallbackPath(formData.get("callbackUrl"));
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
