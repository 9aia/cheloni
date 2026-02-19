import z from "zod";

export const dryRunOptionSchema = z
    .boolean()
    .optional()
    .describe("Executes logic without performing side effects (e.g., no disk writes or API calls).")
    .meta({ aliases: ["n"] });
