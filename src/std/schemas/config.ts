import z from "zod";

export const configOptionSchema = z
    .string()
    .optional()
    .describe("Path for a configuration file")
    .meta({
        aliases: ["c"],
    });
