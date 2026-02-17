import type { PluginDefinition } from "~/core/definition/plugin";

export interface PluginManifest {
    name: string;
}

export function getPluginManifest(plugin: PluginDefinition): PluginManifest {
    return {
        name: plugin.name,
    };
}
