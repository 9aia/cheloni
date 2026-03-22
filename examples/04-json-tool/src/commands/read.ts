import { defineCommand } from "cheloni";
import { pathSchema } from "cheloni/std/os";
import { prettyOptionSchema } from "cheloni/std/ui";
import fs from "node:fs/promises";
import z from "zod";

export const readCommand = defineCommand({
  name: "read",
  paths: ["read", "r"],
  description: "Read and display JSON from a file",
  positional: pathSchema.meta({ description: "JSON file path" }),
  options: z.object({
    pretty: prettyOptionSchema,
  }),
  handler: async ({ positional, options }) => {
    try {
      const content = await fs.readFile(positional, "utf8");
      const json = JSON.parse(content) as unknown;

      if (options.pretty) {
        console.log(JSON.stringify(json, null, 2));
      } else {
        console.log(JSON.stringify(json));
      }
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        console.error(`Error: File "${positional}" not found`);
        process.exit(1);
      } else if (error instanceof SyntaxError) {
        console.error(`Error: Invalid JSON in "${positional}"`);
        process.exit(1);
      } else {
        throw error;
      }
    }
  },
});
