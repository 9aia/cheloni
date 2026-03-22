import z from "zod";

export const pathSchema = z
  .string()
  .regex(/^(?:[a-zA-Z]:\\|\/)?(?:[^<>:"|?*\r\n]+[\\/])*[^<>:"|?*\r\n]*$/, "Invalid file path");

export const dirnameSchema = z
  .string()
  .regex(
    /^(?:[a-zA-Z]:[\\/]|\/)?(?:[^<>:"|?*\r\n\\/]+[\\/])*[^<>:"|?*\r\n\\/]+[\\/]?$/,
    "Invalid directory path",
  );

export const inputOptionSchema = pathSchema.describe("Input file path").meta({ aliases: ["i"] });

export const outputOptionSchema = pathSchema
  .describe("Output file path")
  .optional()
  .meta({ aliases: ["o"] });

export const filesPositionalSchema = z
  .array(pathSchema)
  .min(1, "At least one file path is required")
  .describe("One or more file paths")
  .meta({ name: "files" });
