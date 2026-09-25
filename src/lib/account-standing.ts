import * as React from "react";
import { prisma } from "@/lib/prisma";

// What the app needs to know about an account's current standing — role,
// staff rights, and whether it's disabled — read fresh from the database.
// Both the session token (for STAFF, whose rights can change under them, see
// lib/auth.ts) and requireUser() (the disabled check on every server action)
// need this, often several times in one request; React's per-request cache
// makes that a single query instead of one per call. Outside a React server
// request (unit tests, scripts) there's no request to scope to, so it simply
// reads every time.
const memoize: <A extends unknown[], R>(fn: (...args: A) => R) => (...args: A) => R =
  typeof (React as { cache?: unknown }).cache === "function" ? ((React as unknown as { cache: never }).cache as never) : (fn) => fn;

export const getAccountStanding = memoize((userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, staffMarketScope: true, staffPermissions: true, disabledAt: true, disabledUntil: true },
  }),
);
