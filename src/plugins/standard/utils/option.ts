import z from "zod";
import { getSchemaObject } from "~/lib/zod";
import versionOption from "../global-options/version";

export function mergeOptionsWithVersion(existingOptions: z.ZodTypeAny | undefined): z.ZodTypeAny {
    const versionSchema = versionOption.schema;
    if (!existingOptions) {
        return z.object({ version: versionSchema });
    }
    const existingShape = getSchemaObject(existingOptions);
    if (existingShape) {
        return z.object({
            ...existingShape,
            version: versionSchema,
        });
    }
    // If not a ZodObject, return as-is (can't merge)
    return existingOptions;
};
