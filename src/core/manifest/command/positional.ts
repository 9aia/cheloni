import type z from "zod";
import { getSchemaDeprecated, getSchemaDescription, getSchemaMeta } from "~/utils/definition";

export interface PositionalManifest {
    name?: string;
    description?: string;
    details?: string;
    deprecated?: boolean | string;
}

export function getPositionalManifest(schema: z.ZodTypeAny): PositionalManifest {
    const meta = getSchemaMeta(schema);
    return {
        name: meta?.name,
        description: getSchemaDescription(schema),
        details: meta?.details,
        deprecated: getSchemaDeprecated(schema),
    };
}
