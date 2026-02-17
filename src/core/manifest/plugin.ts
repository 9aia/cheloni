import type { PluginDefinition } from "~/core/definition/plugin";
import { normalizeMaybeArray } from "~/lib/js";
import type { MaybeArray } from "~/lib/ts-utils";

export interface PluginManifest {
    name: string;
}

export function getPluginManifest(plugin: PluginDefinition): PluginManifest {
    return {
        name: plugin.name,
    };
}

export function getPluginsManifest(plugins: MaybeArray<PluginDefinition>): PluginManifest[] {
    const normalizedPlugins = normalizeMaybeArray(plugins);
    return normalizedPlugins.map(plugin => getPluginManifest(plugin));
}
