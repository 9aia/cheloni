import type { PluginDefinition } from "~/core/definition/plugin";
import type { PluginManifest } from "~/core/manifest/plugin";
import { getPluginManifest } from "~/core/manifest/plugin";
import type { RuntimeObject } from "~/utils/creation";

export interface Plugin extends RuntimeObject<PluginManifest> {
    definition: PluginDefinition;
}

export function createPlugin(definition: PluginDefinition): Plugin {
    return {
        definition,
        manifest: getPluginManifest(definition),
    };
}
