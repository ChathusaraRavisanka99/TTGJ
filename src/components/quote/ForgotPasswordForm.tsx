"use client";

import { useActionState } from "react";
import Link from "@/components/ui/MarketLink";
import { requestPasswordReset } from "@/actions/password-reset";
import type { ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";

const initialState: ActionResult = { ok: false, error: "" };

// The server action always returns { ok: true } for any syntactically
// valid email (see its own comment on why — never reveal whether an
// account exists) — this form shows the same generic copy on success
// regardless, and never a different message for "no such account".
export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => requestPasswordReset(formData),
    initialState,
  );

  if (state.ok) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface p-5 text-sm text-charcoal/80">
        If an account exists for that email, we&apos;ve sent a link to reset your password. It expires in an hour.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <FieldError>{state.error || undefined}</FieldError>
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending..." : "Send Reset Link"}
      </Button>
      <p className="text-center text-sm text-charcoal/60">
        <Link href="/account/login" className="underline hover:text-charcoal">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
