import { fileURLToPath } from "node:url";

export default {
  base: "./",
  resolve: {
    alias: { "@caper/engine": fileURLToPath(new URL("../Caper/mod.js", import.meta.url)) },
    dedupe: ["phaser"],
  },
  server: { port: 5173, fs: { allow: [".."] } },
  build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 1800 },
};
