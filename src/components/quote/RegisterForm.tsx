"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerCustomer, authenticateWithCredentials } from "@/actions/auth";
import type { ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

const initialState: ActionResult = { ok: false, error: "" };

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
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
