import z from "zod";
import { getSchemaObject } from "~/utils/definition";
import versionOption from "~/std/global-options/version";

/**
 * Merge a option (with schema) into any Zod options schema.
 */
export function mergeOptionsWith(
    existingOptions: z.ZodTypeAny | undefined,
    name: string,
    schema: z.ZodTypeAny
): z.ZodTypeAny {
    if (!existingOptions) {
        return z.object({ [name]: schema });
    }
    const existingShape = getSchemaObject(existingOptions);
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
    existingOptions: z.ZodTypeAny | undefined
): z.ZodTypeAny {
    if (!versionOption.schema) {
        throw new TypeError("versionOption.schema is not defined");
    }
    return mergeOptionsWith(existingOptions, "version", versionOption.schema);
}
