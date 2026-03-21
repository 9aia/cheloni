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
        "pluginpacks/index": resolve(__dirname, "src/pluginpacks/index.ts"),
        "std/config/index": resolve(__dirname, "src/std/config/index.ts"),
        "std/core/index": resolve(__dirname, "src/std/core/index.ts"),
        "std/git/index": resolve(__dirname, "src/std/git/index.ts"),
        "std/log/index": resolve(__dirname, "src/std/log/index.ts"),
        "std/npm/index": resolve(__dirname, "src/std/npm/index.ts"),
        "std/os/index": resolve(__dirname, "src/std/os/index.ts"),
        "std/parse/index": resolve(__dirname, "src/std/parse/index.ts"),
        "std/semver/index": resolve(__dirname, "src/std/semver/index.ts"),
        "std/ui/index": resolve(__dirname, "src/std/ui/index.ts"),
        "utils/index": resolve(__dirname, "src/utils/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      // This package targets Node CLIs; keep runtime deps external.
      // Bundling c12 drags browser-incompatible transitive deps (tinyexec/giget).
      external: ["zod", "mri", "c12", "defu", "semver", "yaml", /^node:/],
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
