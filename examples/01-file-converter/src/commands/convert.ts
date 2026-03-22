import { defineCommand } from "cheloni";
import { inputOptionSchema, outputOptionSchema } from "cheloni/std/os";
import z from "zod";

export const convertCommand = defineCommand({
  name: "convert",
  paths: ["c", "conv"],
  description: "Convert a file between formats",
  positional: inputOptionSchema,
  options: z.object({
    output: outputOptionSchema,
    format: z
      .enum(["json", "yaml", "toml"])
      .default("json")
      .meta({ aliases: ["f"] }),
  }),
  handler: async ({ positional, options }) => {
    console.log(positional);

    const output = options.output || positional.replace(/\.[^.]+$/, `.${options.format}`);
    console.log(`Converting ${positional} to ${output} (${options.format})`);
  },
});
