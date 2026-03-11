import z from "zod";

/**
 * A schema for cross-platform file paths.
 */
export const pathSchema = z.string().regex(
    /^(?:[a-zA-Z]:\\|\/)?(?:[^<>:"|?*\r\n]+[\\/])*[^<>:"|?*\r\n]*$/,
    "Invalid file path"
);

/**
 * A schema for a directory path.
 */
export const dirnameSchema = z.string().regex(
    /^(?:[a-zA-Z]:[\\/]|\/)?(?:[^<>:"|?*\r\n\\/]+[\\/])*[^<>:"|?*\r\n\\/]+[\\/]?$/,
    "Invalid directory path"
);

/**
 * A schema for an input file path (optional, e.g. for `--input`).
 * @see {@link pathSchema}
 */
export const inputOptionSchema = pathSchema.describe('Input file path').meta({ aliases: ['i'] });

/**
 * A schema for an output file path (optional, e.g. for `--output`).
 * @see {@link pathSchema}
 */
export const outputOptionSchema = pathSchema.describe('Output file path').optional().meta({ aliases: ['o'] });
