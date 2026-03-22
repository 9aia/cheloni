import type { OptionsSchema } from "~/core";

export function getAliasMap(optionsSchema?: OptionsSchema) {
  const object = optionsSchema?.shape;
  if (!object) {
    return {};
  }
  const aliasMap: Record<string, string[]> = {};

  for (const [optionName, schema] of Object.entries(object)) {
    const aliases = schema.meta()?.aliases as string[] | undefined;
    if (aliases !== undefined) {
      aliasMap[optionName] = aliases;
    }
  }

  return aliasMap;
}
