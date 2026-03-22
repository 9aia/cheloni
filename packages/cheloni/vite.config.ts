import { defineConfig } from "vite-plus";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
    },
  },
  test: {
    typecheck: { enabled: true },
  },
  pack: {
    entry: {
      "core/index": "./src/core/index.ts",
      "std/config/index": "./src/std/config/index.ts",
      "std/core/index": "./src/std/core/index.ts",
      "std/git/index": "./src/std/git/index.ts",
      "std/logger/index": "./src/std/logger/index.ts",
      "std/npm/index": "./src/std/npm/index.ts",
      "std/os/index": "./src/std/os/index.ts",
      "std/parse/index": "./src/std/parse/index.ts",
      "std/semver/index": "./src/std/semver/index.ts",
      "std/ui/index": "./src/std/ui/index.ts",
      "plugin-kits/index": "./src/plugin-kits/index.ts",
      "utils/index": "./src/utils/index.ts",
    },
    deps: {
      neverBundle: ["zod", "mri", "c12", "defu", "semver", "yaml", "type-fest", /^node:/],
    },
    format: "esm",
    target: "esnext",
    minify: true,
    sourcemap: true,
    dts: {
      tsgo: true,
    },
    exports: true,
  },
});
