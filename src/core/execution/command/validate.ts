import type z from "zod";
import { InvalidOptionsError } from "./errors";
import { normalizeMaybeArray } from "~/lib/js";
import { getSchemaAlias, getSchemaObject } from "~/utils/definition";

export function getValidOptionNames(optionsSchema: z.ZodTypeAny): Set<string> {
    const validOptionNames = new Set<string>();

    const object = getSchemaObject(optionsSchema);
    if (!object) {
        return validOptionNames;
    }

    for (const [optionName, schema] of Object.entries(object)) {
        validOptionNames.add(optionName);

        // Add aliases to the valid set
        const alias = getSchemaAlias(schema);
        for (const aliasName of normalizeMaybeArray(alias)) {
            validOptionNames.add(aliasName);
        }
    }

    return validOptionNames;
}

export function validateOptionsExist(
    rawOptions: Record<string, any>,
    definedOptions: z.ZodTypeAny | undefined,
    behavior: 'throw' | 'filter-out' | 'pass-through',
    globalOptionNames: Set<string> = new Set()
): Record<string, any> {
    if (!definedOptions) {
        // Filter out global options from unknown options check
        const nonGlobalOptions = Object.keys(rawOptions).filter(opt => !globalOptionNames.has(opt));
        if (nonGlobalOptions.length > 0 && behavior === 'throw') {
            throw new InvalidOptionsError(
                `Unknown options provided: ${nonGlobalOptions.map(opt => `--${opt}`).join(', ')}. This command does not accept any options.`,
                []
            );
        }
        return behavior === 'pass-through' ? rawOptions : {};
    }

    const validOptionNames = getValidOptionNames(definedOptions);
    // Merge command option names with global option names
    const allValidOptionNames = new Set([...validOptionNames, ...globalOptionNames]);
    const providedOptionNames = Object.keys(rawOptions);
    const unknownOptions = providedOptionNames.filter(opt => !allValidOptionNames.has(opt));

    if (unknownOptions.length > 0 && behavior === 'throw') {
        // Build list of available options with their aliases
        const object = getSchemaObject(definedOptions);
        const knownOptions = object 
            ? Object.entries(object).map(([name, schema]) => {
                const alias = getSchemaAlias(schema);
                if (alias) {
                    const aliases = normalizeMaybeArray(alias);
                    const aliasStr = aliases.map(a => `-${a}`).join(', ');
                    return `--${name} (${aliasStr})`;
                }
                return `--${name}`;
            })
            : [];
        
        throw new InvalidOptionsError(
            `Unknown options provided: ${unknownOptions.map(opt => `--${opt}`).join(', ')}.\n` +
            (knownOptions.length > 0 
                ? `Available options: ${knownOptions.join(', ')}`
                : 'This command does not accept any options.'),
            []
        );
    }
    
    if (behavior === 'filter-out') {
        const filteredOptions: Record<string, any> = {};
        for (const [key, value] of Object.entries(rawOptions)) {
            if (allValidOptionNames.has(key)) {
                filteredOptions[key] = value;
            }
        }
        return filteredOptions;
    }
    
    return rawOptions;
}
