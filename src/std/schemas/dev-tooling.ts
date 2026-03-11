import z from "zod";

export const dryRunOptionSchema = z
    .boolean()
    .optional()
    .describe("Executes logic without performing side effects (e.g., no disk writes or API calls).")
    .meta({ aliases: ["n"] });

/**
 * A Git tag name. Same rules as a ref, but must not contain `/`.
 */
export const gitTagSchema = z
    .string()
    .min(1)
    .regex(/^[^\x00-\x1f\x7f ~^:?*\[\\\/]+$/, "Invalid git tag")
    .refine((v) => !v.includes(".."), "Git tag must not contain '..'")
    .refine((v) => !v.endsWith(".lock"), "Git tag must not end with '.lock'")
    .refine((v) => !v.endsWith("."), "Git tag must not end with '.'");

/**
 * A Git ref: branch name, tag, or commit SHA.
 */
export const gitRefSchema = z
    .string()
    .min(1)
    .regex(/^[^\x00-\x1f\x7f ~^:?*\[\\]+$/, "Invalid git ref")
    .refine((v) => !v.startsWith("/") && !v.endsWith("/"), "Git ref must not start or end with '/'")
    .refine((v) => !v.includes(".."), "Git ref must not contain '..'")
    .refine((v) => !v.endsWith(".lock"), "Git ref must not end with '.lock'")
    .refine((v) => !v.endsWith("."), "Git ref must not end with '.'");

/**
 * A Git branch name (same rules as gitRef, plus no bare `@`).
 */
export const branchNameSchema = gitRefSchema
    .refine((v) => v !== "@", "Branch name must not be '@'");

/**
 * A full 40-character hex SHA-1 commit hash.
 */
export const commitHashSchema = z
  .string()
  .regex(/^[0-9a-f]{40}$/i, "Invalid git commit hash");

/**
 * A short (7+) or full (40) hex commit hash.
 */
export const commitHashShortSchema = z
    .string()
    .regex(/^[0-9a-f]{7,40}$/, "Invalid short commit hash");

/**
 * A schema for a valid semver version string.
 */
export const semverSchema = z
  .string()
  .refine(async (value) => {
    const { valid } = await import("semver");
    return valid(value) !== null;
  }, "Invalid semver version");
