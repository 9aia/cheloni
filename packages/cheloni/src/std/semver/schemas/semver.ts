import z from "zod";

export const semverSchema = z.string().refine(async (value) => {
  const { valid } = await import("semver");
  return valid(value) !== null;
}, "Invalid semver version");
