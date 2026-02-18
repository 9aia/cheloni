import type z from "zod";
import type { OptionDefinition } from "~/core/definition/command/option";
import type { MaybeArray } from "~/lib/ts-utils";
import { getSchemaDeprecated, getSchemaObject } from "~/utils/definition";

export interface OptionManifest {
    name: string;
    description?: string;
    details?: string;
    alias?: MaybeArray<string>;
    deprecated?: boolean | string;
}

export function getOptionsManifest(schema: z.ZodTypeAny): OptionManifest[] {
    const object = getSchemaObject(schema);
    if (!object) {
        throw new Error("Options schema is not a valid ZodObject");
    }

    return Object.entries(object).map(([name, optionSchema]) =>
        getOptionManifest(name, optionSchema)
    );
}

export function getOptionManifest(name: string, definition: OptionDefinition): OptionManifest {
    if (!definition) {
        throw new Error("Option definition is required");
    }

    const def = (definition as any)._def;
    return {
        name,
        description: def?.description ?? def?.metadata?.description,
        details: def?.metadata?.details,
        alias: def.alias ?? def?.metadata?.alias,
        deprecated: getSchemaDeprecated(definition),
    };
}
