import type z from "zod";
import type { MaybeArray } from "~/lib/ts-utils";

export function getSchemaObject(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> | undefined {
    if (!schema) {
        return undefined;
    }

    const _schema = schema as any;
    
    try {
        const def = _schema._def;
        
        // Try _def.shape (standard ZodObject structure)
        if (def?.shape) {
            const shape = typeof def.shape === 'function' ? def.shape() : def.shape;
            if (shape && typeof shape === 'object' && !Array.isArray(shape)) {
                return shape;
            }
        }
        
        // Fallback: try schema.shape directly
        if (_schema.shape && typeof _schema.shape === 'object' && !Array.isArray(_schema.shape)) {
            return _schema.shape;
        }
    } catch {
        // Not a ZodObject or shape not accessible
    }
    
    return undefined;
    
}

export function getSchemaDescription(schema: z.ZodTypeAny | undefined): string | undefined {
    if (!schema) return undefined;
    
    try {
        const def = (schema as any)._def;
        if (def?.description) {
            return def.description;
        }
        if (def?.metadata?.description) {
            return def.metadata.description;
        }
    } catch {
        // Ignore errors when accessing internal structure
    }
    
    return undefined;
}

export function getSchemaMeta(schema: z.ZodTypeAny | undefined): Record<string, any> | undefined {
    if (!schema) return undefined;
    
    try {
        const def = (schema as any)._def;
        return def?.metadata;
    } catch {
        // Ignore errors when accessing internal structure
    }
    
    return undefined;
}

export function getSchemaDeprecated(schema: z.ZodTypeAny | undefined): boolean | string | undefined {
    return getSchemaMeta(schema)?.deprecated;
}

export function getSchemaAlias(schema: z.ZodTypeAny | undefined): MaybeArray<string> | undefined {
    return getSchemaMeta(schema)?.alias;
}

export function getAliasMap(optionsSchema: z.ZodTypeAny) {
    const object = getSchemaObject(optionsSchema);
    if (!object) {
        return {};
    }

    const aliasMap: Record<string, string | string[]> = {};

    for (const [optionName, schema] of Object.entries(object)) {
        const alias = getSchemaAlias(schema);
        if (alias !== undefined) {
            aliasMap[optionName] = alias;
        }
    }

    return aliasMap;
}
