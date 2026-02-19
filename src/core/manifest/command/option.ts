import type z from "zod";
import type { OptionDefinition } from "~/core/definition/command/option";
import { getSchemaAliases, getSchemaDeprecated, getSchemaObject, type Manifest } from "~/utils/definition";

export interface OptionManifest extends Manifest {
    description?: string;
    details?: string;
    aliases?: string[];
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

    return {
        name,
        description: (definition as any)._def?.description ?? (definition as any)._def?.metadata?.description,
        details: (definition as any)._def?.metadata?.details,
        aliases: getSchemaAliases(definition),
        deprecated: getSchemaDeprecated(definition),
    };
}
