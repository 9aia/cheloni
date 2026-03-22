import { defineCommand } from "cheloni";
import { outputOptionSchema, pathSchema } from "cheloni/std/os";
import z from "zod";

export const convertCommand = defineCommand({
  name: "convert",
  paths: ["c", "conv"],
  description: "Convert files between formats",
  positional: pathSchema.meta({ description: "Input file" }),
  options: z.object({
    output: outputOptionSchema,
    format: z
      .enum(["json", "yaml", "toml"])
      .default("json")
      .meta({ aliases: ["f"] }),
  }),
  handler: async ({ positional, options }) => {
    const output = options.output || positional.replace(/\.[^.]+$/, `.${options.format}`);
    console.log(`Converting ${positional} to ${output} (${options.format})`);
  },
});
