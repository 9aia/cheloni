import z from "zod";

export const versionOptionSchema = z
    .boolean()
    .optional()
    .describe("Show version information")
    .meta({ aliases: ["v"] });
