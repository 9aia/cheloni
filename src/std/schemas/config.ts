import { pathSchema } from "./path";

export const configOptionSchema = pathSchema
    .optional()
    .describe("Path for a configuration file")
    .meta({
        aliases: ["c"],
    });
