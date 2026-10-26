import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * `.mts` rather than `.ts`: this project is CommonJS (no `"type": "module"` in
 * package.json, because next.config.ts and postcss.config.mjs are happier that
 * way), and Vite warns when it has to load ESM syntax from a `.ts` config.
 *
 * Path aliases come from `resolve.tsconfigPaths`, which Vite now supports
 * natively — the `vite-tsconfig-paths` plugin is no longer needed for this.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    css: false,
  },
});
