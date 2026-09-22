import { beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "./prisma-mock";

// Runs before any test file's own imports resolve (see vitest.config.ts's
// `setupFiles`), so every `import { prisma } from "@/lib/prisma"` anywhere
// in the code under test — however many modules deep — resolves to the
// shared mock in prisma-mock.ts instead of touching a real database.
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

beforeEach(() => {
  resetPrismaMock();
});
