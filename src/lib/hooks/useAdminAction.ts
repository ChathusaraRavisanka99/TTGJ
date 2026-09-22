"use client";

import { useState, useTransition } from "react";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Runs a server action with pending/error state, and a try/catch safety
 * net around it. Without the catch, an action that *throws* (a network
 * hiccup, a DB timeout — not the same as it returning `{ok:false}`) skips
 * straight past any error-handling code the caller had after the await,
 * leaving nothing shown to the user; under `useTransition` `pending`
 * still resolves, but under a plain `useState` pending flag it doesn't
 * either, so the button is stuck on its loading label forever.
 */
export function useAdminAction() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<ActionResult>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await fn();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onSuccess?.();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return { pending, error, run, setError };
}
