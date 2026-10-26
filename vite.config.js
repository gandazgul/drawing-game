import { defineConfig } from "vite-plus";

const toolingIgnores = [
  "dist/**",
  "assets/**",
  "docs/**",
  "context/**",
  ".agents/**",
  ".claude/**",
  ".impeccable/**",
  ".idea/**",
  ".vite/**",
  "skills-lock.json",
  "cast-tracker.json",
  "DESIGN.md",
  "PRODUCT.md",
  ".*-output.md",
];

export default defineConfig({
  base: "./",
  resolve: { dedupe: ["phaser"] },
  server: { port: 5173 },
  build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 1800 },
  test: { include: ["tests/**/*.test.js"], environment: "node" },
  lint: { ignorePatterns: toolingIgnores },
  fmt: { printWidth: 110, tabWidth: 2, ignorePatterns: toolingIgnores },
});
