import z from "zod";
import type { OptionSchema, OptionsSchema } from "~/core";
import versionOption from "~/std/options/version";

/**
 * Merge a option (with schema) into any Zod options schema.
 */
export function mergeOptionsWith(
    existingOptions: OptionsSchema | undefined,
    name: string,
    schema: OptionSchema
): OptionsSchema {
    if (!existingOptions) {
        return z.object({ [name]: schema });
    }
    const existingShape = existingOptions.shape;
    if (existingShape) {
        return z.object({
            ...existingShape,
            [name]: schema,
        });
    }
    // If not a ZodObject, return as-is (can't merge)
    return existingOptions;
}

export function mergeOptionsWithVersion(
    existingOptions: OptionsSchema | undefined
): OptionsSchema {
    if (!versionOption.schema) {
        throw new TypeError("versionOption.schema is not defined");
    }
    return mergeOptionsWith(existingOptions, "version", versionOption.schema);
}
