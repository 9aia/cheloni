import z from "zod";

/**
 * A schema for cross-platform file paths.
 */
export const pathSchema = z.string().regex(
    /^(?:[a-zA-Z]:\\|\/)?(?:[^<>:"|?*\r\n]+[\\/])*[^<>:"|?*\r\n]*$/,
    "Invalid file path"
);

/**
 * A schema for an output file path (optional, e.g. for `--output`). Uses the cross-platform pathSchema.
 */
export const outputOptionSchema = pathSchema.describe('Output file path').optional().meta({ aliases: ['o'] });
