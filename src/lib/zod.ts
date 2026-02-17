import type z from "zod";

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

export function getSchemaAlias(schema: z.ZodTypeAny | undefined): string | string[] | undefined {
    if (!schema) return undefined;
    
    // Try to access alias from Zod's internal structure
    try {
        const def = (schema as any)._def;
        // Some Zod versions store it differently
        if (def?.metadata?.alias !== undefined) {
            return def.metadata.alias;
        }
    } catch {
        // Ignore errors when accessing internal structure
    }
    
    return undefined;
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

export function getSchemaDeprecated(schema: z.ZodTypeAny | undefined): boolean | string | undefined {
    if (!schema) return undefined;
    
    try {
        const def = (schema as any)._def;
        if (def?.deprecated !== undefined) {
            return def.deprecated;
        }
        if (def?.metadata?.deprecated !== undefined) {
            return def.metadata.deprecated;
        }
    } catch {
        // Ignore errors when accessing internal structure
    }
    
    return undefined;
}
