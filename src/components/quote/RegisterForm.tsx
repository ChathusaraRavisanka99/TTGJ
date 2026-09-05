"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerCustomer, authenticateWithCredentials } from "@/actions/auth";
import type { ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

const initialState: ActionResult = { ok: false, error: "" };

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [customerType, setCustomerType] = useState<"RETAIL" | "WHOLESALE">("RETAIL");
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult, formData: FormData) => {
    const result = await registerCustomer(formData);
    if (!result.ok) return result;
    // authenticateWithCredentials redirects on success, so this only
    // returns when sign-in itself fails right after registration.
    return authenticateWithCredentials(formData);
  }, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div>
          <Label>Account Type</Label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(["RETAIL", "WHOLESALE"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCustomerType(type)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  customerType === type ? "border-gold bg-gold/10 text-charcoal" : "border-border-subtle text-charcoal/60 hover:border-charcoal/30",
                )}
              >
                {type === "RETAIL" ? "Retail Customer" : "Wholesale Buyer"}
              </button>
            ))}
          </div>
          <input type="hidden" name="customerType" value={customerType} />
          {customerType === "WHOLESALE" && (
            <p className="mt-1.5 text-xs text-charcoal/50">
              Wholesale accounts are reviewed by our team before approval — you can browse, request quotes, and buy
              retail in the meantime.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" autoComplete="tel" />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth (optional)</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" autoComplete="bday" />
          <p className="mt-1 text-xs text-charcoal/45">Unlocks a birthday discount during your birth month.</p>
        </div>

        {customerType === "WHOLESALE" && (
          <>
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" name="businessName" required autoComplete="organization" />
            </div>
            <div>
              <Label htmlFor="businessRegNo">Business Registration Number</Label>
              <Input id="businessRegNo" name="businessRegNo" required />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        {!state.ok && state.error && <p className="text-sm text-red-700">{state.error}</p>}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-charcoal/60">
        Already have an account?{" "}
        <Link href="/account/login" className="underline hover:text-charcoal">
          Sign in
        </Link>
      </p>
    </div>
  );
}
