import type z from "zod";
import { getSchemaDeprecated } from "~/utils/definition";

export interface PositionalManifest {
    description?: string;
    details?: string;
    deprecated?: boolean | string;
}

export function getPositionalManifest(schema: z.ZodTypeAny): PositionalManifest {
    const def = (schema as any)._def;
    return {
        description: def?.description || def?.metadata?.description,
        details: def?.metadata?.details,
        deprecated: getSchemaDeprecated(schema),
    };
}
