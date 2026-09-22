"use client";

import { useActionState } from "react";
import Link from "@/components/ui/MarketLink";
import { resetPassword } from "@/actions/password-reset";
import type { ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";

const initialState: ActionResult = { ok: false, error: "" };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => resetPassword(formData),
    initialState,
  );

  if (state.ok) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border-subtle bg-surface p-5 text-sm text-charcoal/80">
          Your password has been reset.
        </div>
        <Link href="/account/login" className="block">
          <Button type="button" variant="primary" size="lg" className="w-full">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password">New Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <FieldError>{state.error || undefined}</FieldError>
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
        {pending ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}
