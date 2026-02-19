import type z from "zod";
import type { RuntimeObject } from "./creation";

export interface Manifest {
    name: string;
}  

/**
 * A Map that is keyed by the manifest name.
 */
export class ManifestKeyedMap<T extends RuntimeObject = RuntimeObject> extends Map<string, T> {
    override set(key: string, value: T): this;
    override set(value: T): this;
    
    override set(keyOrValue: string | T, value?: T): this {
      if (value !== undefined) {
        return super.set((value as T).manifest.name, value);
      }
  
      const val = keyOrValue as T;
      return super.set(val.manifest.name, val);
    }
}

function safeToJSONSchema(schema: z.ZodTypeAny | undefined): any | undefined {
    if (!schema) return undefined;

    try {
        const fn = (schema as any).toJSONSchema;
        if (typeof fn === "function") {
            return fn.call(schema);
        }
    } catch {
        // ignore
    }

    return undefined;
}

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
        // Zod v4 exposes `description` as a getter.
        const direct = (schema as any).description;
        if (typeof direct === "string" && direct.length > 0) {
            return direct;
        }

        const def = (schema as any)._def;
        if (def?.description) {
            return def.description;
        }
        if (def?.metadata?.description) {
            return def.metadata.description;
        }

        // Fallback: Zod v4 `.meta()` fields are applied to JSON Schema output.
        const jsonSchema = safeToJSONSchema(schema);
        if (jsonSchema?.description && typeof jsonSchema.description === "string") {
            return jsonSchema.description;
        }
    } catch {
        // Ignore errors when accessing internal structure
    }
    
    return undefined;
}

export function getSchemaMeta(schema: z.ZodTypeAny | undefined): Record<string, any> | undefined {
    if (!schema) return undefined;
    
    try {
        // Zod v4 `.meta()` fields show up on the generated JSON Schema object.
        const jsonSchema = safeToJSONSchema(schema);
        if (jsonSchema && typeof jsonSchema === "object") {
            return jsonSchema as Record<string, any>;
        }

        // Legacy fallback (Zod v3-ish)
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

export function getSchemaAliases(schema: z.ZodTypeAny | undefined): string[] | undefined {
    const meta = getSchemaMeta(schema);
    const raw = meta?.aliases;
    if (raw === undefined) return undefined;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return [raw];
    return undefined;
}

export function getAliasMap(optionsSchema: z.ZodTypeAny) {
    const object = getSchemaObject(optionsSchema);
    if (!object) {
        return {};
    }

    const aliasMap: Record<string, string[]> = {};

    for (const [optionName, schema] of Object.entries(object)) {
        const aliases = getSchemaAliases(schema);
        if (aliases !== undefined) {
            aliasMap[optionName] = aliases;
        }
    }

    return aliasMap;
}
