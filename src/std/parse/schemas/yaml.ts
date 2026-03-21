import z from "zod";

export const yamlDataSchema = z
    .string()
    .transform(async (value, ctx) => {
        try {
            const YAML = await import("yaml");
            return YAML.parse(value);
        } catch {
            ctx.addIssue({
                code: "custom",
                message: "Invalid YAML",
            });
            return z.NEVER;
        }
    });
