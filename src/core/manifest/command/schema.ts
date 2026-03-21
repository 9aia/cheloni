import type { ZodTypeAny } from "zod";

/**
 * Returns the explicit default value declared with `.default(...)`, if any.
 * It unwraps common wrappers (`optional`, `nullable`, `readonly`, `catch`, `pipe`).
 */
export function getSchemaDefaultValue(schema: ZodTypeAny | undefined): unknown {
    if (!schema) {
        return undefined;
    }

    const def = schema._def as unknown as Record<string, unknown>;
    const type = def.type;

    if (type === "default") {
        return def.defaultValue;
    }

    if (type === "pipe") {
        return getSchemaDefaultValue(def.in as ZodTypeAny | undefined);
    }

    if (type === "optional" || type === "nullable" || type === "readonly" || type === "catch") {
        return getSchemaDefaultValue(def.innerType as ZodTypeAny | undefined);
    }

    return undefined;
}
