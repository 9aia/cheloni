import z from "zod";

export const jsonOptionSchema = z
    .boolean()
    .optional()
    .meta({
        description: "Suppress UI and output raw JSON",
        details: "Suppresses all UI elements and spinners, outputting only raw JSON for easy piping to tools like jq.",
    });

export const prettyOptionSchema = z
    .boolean()
    .optional()
    .describe("Pretty print the output")
    .meta({ aliases: ['p'] })
    .default(false);
