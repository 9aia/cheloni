import z from "zod";

export const jsonDataSchema = z
    .string()
    .transform((value, ctx) => {
        try {
            return JSON.parse(value);
        } catch {
            ctx.addIssue({
                code: "custom",
                message: "Invalid JSON",
            });
            return z.NEVER;
        }
    });
