import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  test: {
    globals: true,
    environment: "node",
    projects: ["packages/*/vite.config.ts", "examples/*/vite.config.ts"],
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: [".agents/skills/**"],
  },
});
