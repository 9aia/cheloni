import type z from "zod";
import type { OptionDefinition, OptionSchema } from "~/core/definition/command/option";
import { getSchemaAliases, getSchemaDeprecated, getSchemaDescription, getSchemaMeta, getSchemaObject, type Manifest } from "~/utils/definition";

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

export function getOptionManifest(name: string, definition: OptionSchema): OptionManifest {
    if (!definition) {
        throw new Error("Option definition is required");
    }

    return {
        name,
        description: getSchemaDescription(definition),
        details: getSchemaMeta(definition)?.details,
        aliases: getSchemaAliases(definition),
        deprecated: getSchemaDeprecated(definition),
    };
}

export function getOptionDefinitionManifest(optionDefinition: OptionDefinition): OptionManifest {
    if (!optionDefinition.schema) {
        return {
            name: optionDefinition.name,
        };
    }
    return getOptionManifest(optionDefinition.name, optionDefinition.schema);
}
