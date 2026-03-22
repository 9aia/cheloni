import type { OptionSchema, OptionsSchema } from "~/core/definition/command/option";
import { getSchemaDefaultValue } from "~/core/manifest/command/schema";

export type OptionManifest = {
  name: string;
  description?: string;
  details?: string;
  aliases: string[];
  deprecated: boolean | string;
  // TODO: infer default value from schema
  defaultValue?: unknown;
};

export type OptionsManifest = OptionManifest[];

export function getOptionsManifest(schema: OptionsSchema): OptionManifest[] {
  const object = schema.shape;

  if (!object) {
    return [];
  }

  return Object.entries(object).map(([name, optionSchema]) =>
    getOptionManifest(name, optionSchema as OptionSchema),
  );
}

export function getOptionManifest(fallbackName: string, definition?: OptionSchema): OptionManifest {
  if (!definition) {
    return {
      name: fallbackName,
      deprecated: false,
      aliases: [],
      defaultValue: undefined,
    };
  }

  const meta = definition.meta() ?? ({} as Record<string, unknown>);

  return {
    name: (meta.name as string) ?? fallbackName,
    description: meta.description as string | undefined,
    details: meta.details as string | undefined,
    aliases: (meta.aliases as string[]) ?? [],
    deprecated: (meta.deprecated as boolean | string) ?? false,
    defaultValue: getSchemaDefaultValue(definition),
  };
}
