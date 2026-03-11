import type { OptionSchema, OptionsSchema } from "~/core/definition/command/option";

export type OptionManifest = {
    name: string;
    description?: string;
    details?: string;
    aliases: string[];
    deprecated: boolean | string;
};

export type OptionsManifest = OptionManifest[];

export function getOptionsManifest(schema: OptionsSchema): OptionManifest[] {
    const object = schema.shape;

    if(!object) {
        return [];
    }

    return Object.entries(object).map(([name, optionSchema]) =>
        getOptionManifest(name, optionSchema as OptionSchema)
    );
}

export function getOptionManifest(fallbackName: string, definition?: OptionSchema): OptionManifest {
    if (!definition) {
        return {
            name: fallbackName,
            deprecated: false,
            aliases: [],
        };
    }

    const meta = definition.meta() ?? {} as Record<string, unknown>;

    return {
        name: (meta.name as string) ?? fallbackName,
        description: meta.description as string | undefined,
        details: meta.details as string | undefined,
        aliases: (meta.aliases as string[]) ?? [],
        deprecated: (meta.deprecated as boolean | string) ?? false,
    };
}
