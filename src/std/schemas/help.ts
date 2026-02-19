import z from "zod";

export const helpPositionalSchema = z.string().optional().describe("Command name to show help for");

export const helpOptionSchema = z.boolean()
    .optional()
    .describe("Show help")
    .meta({ aliases: ["h"] })
