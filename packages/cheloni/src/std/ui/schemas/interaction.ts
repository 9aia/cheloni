import z from "zod";

export const interactiveOptionSchema = z
  .boolean()
  .optional()
  .describe("Prompt for confirmation before performing actions, especially destructive ones.")
  .meta({ aliases: ["i"] });

export const yesOptionSchema = z
  .boolean()
  .optional()
  .describe("Assume yes to all prompts")
  .meta({ aliases: ["y"] });

export const forceOptionSchema = z
  .boolean()
  .optional()
  .meta({
    description: "Force the command to run",
    details: "Don't ask for confirmation for dangerous actions.",
    aliases: ["f"],
  });
