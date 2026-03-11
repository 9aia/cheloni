import type z from "zod";
import { InvalidOptionsError } from "./errors";
import type { OptionsSchema } from "~/core/definition/command/option";

export function getValidOptionNames(optionsSchema: OptionsSchema | undefined): Set<string> {
    const validOptionNames = new Set<string>();

    const object = optionsSchema?.shape;
    if (!object) {
        return validOptionNames;
    }

    for (const [optionName, schema] of Object.entries(object)) {
        validOptionNames.add(optionName);

        const meta = schema.meta() ?? {} as Record<string, unknown>;
        const aliases = (meta.aliases as string[]) || [];

        // Add aliases to the valid set
        for (const aliasName of aliases) {
            validOptionNames.add(aliasName);
        }
    }

    return validOptionNames;
}

export function validateOptionsExist(
    rawOptions: Record<string, any>,
    definedOptions: OptionsSchema | undefined,
    behavior: 'throw' | 'filter-out' | 'pass-through',
    inheritedOptionNames: Set<string> = new Set()
): Record<string, any> {
    if (!definedOptions) {
        // Command defines no options — only global options are allowed (unless pass-through)
        const providedOptionNames = Object.keys(rawOptions);
        const nonInheritedOptions = providedOptionNames.filter(opt => !inheritedOptionNames.has(opt));

        if (nonInheritedOptions.length > 0 && behavior === 'throw') {
            throw new InvalidOptionsError(
                `Unknown options provided: ${nonInheritedOptions.map(opt => `--${opt}`).join(', ')}. This command does not accept any options.`,
                []
            );
        }

        if (behavior === 'filter-out') {
            const filtered: Record<string, any> = {};
            for (const [key, value] of Object.entries(rawOptions)) {
                if (inheritedOptionNames.has(key)) {
                    filtered[key] = value;
                }
            }
            return filtered;
        }

        // For both 'throw' (after validation) and 'pass-through', keep parsed values so
        // global options can still execute (e.g. `-h`, `--version`, `-v`).
        return rawOptions;
    }

    const validOptionNames = getValidOptionNames(definedOptions);
    // Merge command option names with global option names
    const allValidOptionNames = new Set([...validOptionNames, ...inheritedOptionNames]);
    const providedOptionNames = Object.keys(rawOptions);
    const unknownOptions = providedOptionNames.filter(opt => !allValidOptionNames.has(opt));

    if (unknownOptions.length > 0 && behavior === 'throw') {
        // Build list of available options with their aliases
        const object = definedOptions?.shape;
        const knownOptions = object 
            ? Object.entries(object).map(([name, schema]) => {
                const meta = schema.meta() ?? {} as Record<string, unknown>;
                const aliases = (meta.aliases as string[]) || [];
                if (aliases.length > 0) {
                    const aliasStr = aliases.map((a: string) => `-${a}`).join(', ');
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
