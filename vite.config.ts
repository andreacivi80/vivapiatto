import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync } from "node:fs";

const packageVersion = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
).version as string;

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "vivapiatto-release-version",
      closeBundle() {
        const html = readFileSync(new URL("./dist/index.html", import.meta.url), "utf8");
        const script = html.match(/<script\b[^>]*\bsrc="([^"]+)"/i)?.[1];
        if (!script) throw new Error("Asset JavaScript della release non trovato");
        writeFileSync(
          new URL("./dist/version.json", import.meta.url),
          `${JSON.stringify({ version: packageVersion, script })}\n`,
        );
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 550,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor",
              test: /node_modules/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
