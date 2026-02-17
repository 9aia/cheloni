import type { PluginDefinition } from "~/core/definition/plugin";
import type { PluginManifest } from "~/core/manifest/plugin";
import { getPluginManifest } from "~/core/manifest/plugin";

export interface Plugin {
    definition: PluginDefinition;
    manifest: PluginManifest;
}

export function createPlugin(definition: PluginDefinition): Plugin {
    return {
        definition,
        manifest: getPluginManifest(definition),
    };
}
