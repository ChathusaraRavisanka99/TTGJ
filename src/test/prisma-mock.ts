import type { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";

/**
 * The one Prisma mock every unit test shares — a deep mock matching
 * PrismaClient's full shape, so `prismaMock.user.findUnique.mockResolvedValue(...)`
 * etc. works for any model/method without per-test boilerplate.
 *
 * Registered as the module vi.mock("@/lib/prisma") returns (see setup.ts),
 * so any `import { prisma } from "@/lib/prisma"` anywhere in the code under
 * test resolves to this object during tests — reset before every test in
 * setup.ts's beforeEach, so mocked return values never leak between tests.
 *
 * `Tx = Prisma.TransactionClient | PrismaClient` (see lib/rewards.ts) means
 * this same mock structurally satisfies any function that takes a `tx`
 * parameter, so it doubles as the transaction client in tests too — pass
 * `prismaMock` directly wherever a test needs to hand in a `tx`.
 */
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

export function resetPrismaMock(): void {
  mockReset(prismaMock);
  // $transaction's default behaviour, restored after every reset: run the
  // array form as Promise.all, and the interactive-callback form by handing
  // the callback this same mock as its `tx` — so most tests never need to
  // configure $transaction at all, only the calls made through it.
  prismaMock.$transaction.mockImplementation((((arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    if (typeof arg === "function") return (arg as (tx: typeof prismaMock) => unknown)(prismaMock);
    return Promise.resolve(arg);
  }) as unknown) as typeof prismaMock.$transaction);
}
