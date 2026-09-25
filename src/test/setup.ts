import { beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "./prisma-mock";

// Runs before any test file's own imports resolve (see vitest.config.ts's
// `setupFiles`), so every `import { prisma } from "@/lib/prisma"` anywhere
// in the code under test — however many modules deep — resolves to the
// shared mock in prisma-mock.ts instead of touching a real database.
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

// next/cache's revalidatePath/revalidateTag require a real Next.js
// request/static-generation context ("Invariant: static generation store
// missing") that doesn't exist in a unit test — server actions call these
// as a side effect, not something under test, so they're no-ops here.
// Global (not per-test-file) since any src/actions/*.test.ts will hit this.
// unstable_cache just runs the function: there is no Next cache in unit tests.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn }));

beforeEach(() => {
  resetPrismaMock();
});
