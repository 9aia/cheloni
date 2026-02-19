import type { RootCommand } from "~/core/creation/command";
import { createRootCommand } from "~/core/creation/command";
import type { Plugin } from "~/core/creation/plugin";
import { createPlugin } from "~/core/creation/plugin";
import type { CliDefinition } from "~/core/definition/cli";
import { getCliManifest, type CliManifest } from "~/core/manifest/cli";
import type { PluginDefinition } from "~/core/definition/plugin";
import type { RuntimeObject } from "~/utils/creation";
import { ManifestKeyedMap } from "~/utils/definition";

export interface Cli extends RuntimeObject<CliManifest> {
    /** The root command of the CLI */
    command?: RootCommand;
    /** Plugins applied to all commands */
    plugins: ManifestKeyedMap<Plugin>;
}

export async function createCli(definition: CliDefinition): Promise<Cli> {
    const manifest = getCliManifest(definition);

    const pluginMap = new ManifestKeyedMap<Plugin>();

    // Create root command from definition (if provided)
    const command = definition.command ? createRootCommand(definition.command) : undefined;

    // Create plugins from definitions and pluginpacks
    const pluginDefinitions: PluginDefinition[] = [];
    
    // Add plugins from plugin field
    pluginDefinitions.push(...(definition.plugins ?? []));
    
    // Add plugins from pluginpack field
    for (const pluginpackDef of definition.pluginpacks ?? []) {
        pluginDefinitions.push(...(pluginpackDef.plugins ?? []));
    }
    
    for (const pluginDef of pluginDefinitions) {
        const plugin = createPlugin(pluginDef);
        pluginMap.set(plugin);
    }

    const cli: Cli = {
        manifest,
        command,
        plugins: pluginMap,
    };

    // Call onInit hooks for all plugins
    for (const plugin of pluginMap.values()) {
        if (plugin.definition.onInit) {
            try {
                await plugin.definition.onInit({ cli, plugin });
            } catch (error) {
                // Log hook errors and rethrow - CLI initialization should fail if onInit fails
                console.error(`Plugin ${plugin.manifest.name} onInit hook failed:`, error);
                // Ensure we throw a proper error if the caught value is not an Error instance
                if (error instanceof Error) {
                    throw error;
                } else {
                    throw new Error(`Plugin ${plugin.manifest.name} onInit hook failed: ${error}`);
                }
            }
        }
    }

    return cli;
}
