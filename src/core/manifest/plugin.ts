import type { PluginDefinition } from "~/core/definition/plugin";
import type { Manifest } from "~/utils/definition";

export interface PluginManifest extends Manifest {}

export function getPluginManifest(plugin: PluginDefinition): PluginManifest {
    return {
        name: plugin.name,
    };
}

export function getPluginsManifest(plugins: PluginDefinition[]): PluginManifest[] {
    return plugins.map(plugin => getPluginManifest(plugin));
}
