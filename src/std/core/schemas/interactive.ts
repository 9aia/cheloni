import z from "zod";

export const interactiveOptionSchema = z
    .boolean()
    .optional()
    .describe("Prompt for confirmation before performing actions, especially destructive ones.")
    .meta({ aliases: ["i"] });
