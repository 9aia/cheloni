import z from "zod";
import type { OptionSchema, OptionsSchema } from "~/core";
import versionOption from "~/std/core/options/version";

export function mergeOptionsWith(
    existingOptions: OptionsSchema | undefined,
    name: string,
    schema: OptionSchema,
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
    return existingOptions;
}

export function mergeOptionsWithVersion(
    existingOptions: OptionsSchema | undefined,
): OptionsSchema {
    if (!versionOption.schema) {
        throw new TypeError("versionOption.schema is not defined");
    }
    return mergeOptionsWith(existingOptions, "version", versionOption.schema);
}
