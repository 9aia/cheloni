import type z from "zod";
import { getSchemaDeprecated, getSchemaMeta } from "~/utils/definition";

export interface PositionalManifest {
    name?: string;
    description?: string;
    details?: string;
    deprecated?: boolean | string;
}

export function getPositionalManifest(schema: z.ZodTypeAny): PositionalManifest {
    const def = (schema as any)._def;
    const meta = getSchemaMeta(schema);
    return {
        name: meta?.name,
        description: def?.description || def?.metadata?.description,
        details: def?.metadata?.details,
        deprecated: getSchemaDeprecated(schema),
    };
}
