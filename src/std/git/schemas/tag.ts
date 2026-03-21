import z from "zod";

export const gitTagSchema = z
    .string()
    .min(1)
    .regex(/^[^\x00-\x1f\x7f ~^:?*\[\\\/]+$/, "Invalid git tag")
    .refine((v) => !v.includes(".."), "Git tag must not contain '..'")
    .refine((v) => !v.endsWith(".lock"), "Git tag must not end with '.lock'")
    .refine((v) => !v.endsWith("."), "Git tag must not end with '.'");
