import z from "zod";

export const gitRefSchema = z
    .string()
    .min(1)
    .regex(/^[^\x00-\x1f\x7f ~^:?*\[\\]+$/, "Invalid git ref")
    .refine((v) => !v.startsWith("/") && !v.endsWith("/"), "Git ref must not start or end with '/'")
    .refine((v) => !v.includes(".."), "Git ref must not contain '..'")
    .refine((v) => !v.endsWith(".lock"), "Git ref must not end with '.lock'")
    .refine((v) => !v.endsWith("."), "Git ref must not end with '.'");
