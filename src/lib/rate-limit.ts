import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export interface RateLimitResult {
  allowed: boolean;
  /** How many more attempts are allowed before the window resets. */
  remaining: number;
}

/**
 * A fixed-window counter, atomically incremented-or-reset by a single
 * upsert — see the RateLimitBucket schema comment for why this is
 * Postgres-backed rather than in-memory or Redis. `key` should already be
 * namespaced by the caller (e.g. `login:${email}`, `register:${ip}`) so
 * different actions never share a bucket.
 *
 * The CASE expressions decide, inside the single query, whether the
 * existing row's window has expired: if so the count resets to 1 and the
 * window restarts from now; if not, the count just increments. This is the
 * same "claim via one atomic write, never read-then-write" discipline
 * finalizeDiscountRedemption's conditional updateMany already follows —
 * two concurrent requests against the same key can't both read a stale
 * count and both slip through.
 */
export async function checkRateLimit(key: string, opts: { limit: number; windowSeconds: number }): Promise<RateLimitResult> {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" (id, count, "windowStart", "updatedAt")
    VALUES (${key}, 1, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      count = CASE
        WHEN "RateLimitBucket"."windowStart" < now() - make_interval(secs => ${opts.windowSeconds})
        THEN 1
        ELSE "RateLimitBucket".count + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitBucket"."windowStart" < now() - make_interval(secs => ${opts.windowSeconds})
        THEN now()
        ELSE "RateLimitBucket"."windowStart"
      END,
      "updatedAt" = now()
    RETURNING count;
  `;
  const count = rows[0]?.count ?? 1;
  return { allowed: count <= opts.limit, remaining: Math.max(0, opts.limit - count) };
}

/**
 * The requesting client's IP, from the `x-forwarded-for` header Vercel
 * (and most reverse proxies) set — the first entry is the original client;
 * later ones are intermediate proxies. Falls back to `x-real-ip`, then to
 * a constant so an IP-keyed rate limit still degrades to "one shared
 * bucket for everyone" rather than throwing when neither header is
 * present (local dev without a proxy in front, for instance) — a shared
 * fallback bucket is still strictly safer than skipping the limit
 * entirely.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = h.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
