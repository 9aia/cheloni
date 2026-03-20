import z from "zod";

/**
 * A schema for a valid semver version string.
 */
export const semverSchema = z
  .string()
  .refine(async (value) => {
    const { valid } = await import("semver");
    return valid(value) !== null;
  }, "Invalid semver version");
