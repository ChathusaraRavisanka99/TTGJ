import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const alias = { "@": path.resolve(dirname, "./src") };

// Two projects: "node" is the original pure logic / Prisma-mocked
// business-logic suite (server actions, lib functions — most of this
// app's components are server components reading the DB directly, which
// belongs in the project's Playwright end-to-end checks, not here). "dom"
// is for the handful of client components whose own interactive state
// (a button's pending/error handling, in particular) is worth covering
// directly rather than only by hand with Playwright.
export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
          setupFiles: ["./src/test/setup.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./src/test/setup.dom.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**", "src/actions/**"],
    },
  },
});
