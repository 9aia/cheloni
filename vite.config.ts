import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: {
        "core/index": resolve(__dirname, "src/core/index.ts"),
        "plugins/index": resolve(__dirname, "src/plugins/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: ["zod", "mri", /^node:/],
    },
    target: "esnext",
    minify: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
    },
  },
  plugins: [
    dts({
      tsconfigPath: "./tsconfig.json",
      include: ["src"],
      entryRoot: "src",
    }),
  ],
});
