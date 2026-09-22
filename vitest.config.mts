import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Unit tests only — no React rendering here (this app's components are
// almost all server components reading the DB directly, which belongs in
// the project's existing Playwright end-to-end checks, not a unit suite).
// This config exists for pure logic and Prisma-mocked business-logic
// tests colocated as `*.test.ts` next to the source they cover.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**", "src/actions/**"],
    },
  },
});
