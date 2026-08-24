"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticateWithCredentials, signInWithGoogle } from "@/actions/auth";
import type { ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

const initialState: ActionResult = { ok: false, error: "" };

export function LoginForm({ callbackUrl, googleEnabled }: { callbackUrl: string; googleEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => authenticateWithCredentials(formData),
    initialState
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {!state.ok && state.error && <p className="text-sm text-red-700">{state.error}</p>}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-charcoal/40">
            <div className="h-px flex-1 bg-border-subtle" />
            or
            <div className="h-px flex-1 bg-border-subtle" />
          </div>
          <form action={signInWithGoogle}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <Button type="submit" variant="outline" size="lg" className="w-full">
              Continue with Google
            </Button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-charcoal/60">
        New here?{" "}
        <Link href="/account/register" className="underline hover:text-charcoal">
          Create an account
        </Link>
      </p>
    </div>
  );
}
