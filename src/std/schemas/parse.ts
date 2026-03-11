import z from "zod";

/**
 * Schema for a JSON string.
 */
export const jsonDataSchema = z
  .string()
  .transform((value, ctx) => {
    try {
      return JSON.parse(value)
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Invalid JSON"
      })
      return z.NEVER
    }
  })
  
/**
 * Schema for a YAML string.
 */
export const yamlDataSchema = z
    .string()
    .transform(async (value, ctx) => {
        try {
        const YAML = await import("yaml");
         return YAML.parse(value)
        } catch {
            ctx.addIssue({
                code: "custom",
                message: "Invalid YAML"
            })
            return z.NEVER
        }
    })
