import type { OptionsSchema } from "~/core";
import type { RuntimeObject } from "./creation";

/**
 * A manifest is a serializable representation of a definition.
 */
export interface Manifest {
    name: string;
};

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
