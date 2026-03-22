import { pathSchema } from "~/std/os/schemas/path";

export const configOptionSchema = pathSchema
  .optional()
  .describe("Path for a configuration file")
  .meta({
    aliases: ["c"],
  });
