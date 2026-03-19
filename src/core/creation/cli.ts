import type { RootCommand } from "~/core/creation/command";
import { createRootCommand } from "~/core/creation/command";
import type { Plugin } from "~/core/creation/plugin";
import { createPlugin } from "~/core/creation/plugin";
import type { CliDefinition, CliErrorHandler } from "~/core/definition/cli";
import { getCliManifest, type CliManifest } from "~/core/manifest/cli";
import type { PluginDefinition } from "~/core/definition/plugin";
import type { RuntimeObject } from "~/utils/creation";
import { ManifestKeyedMap } from "~/utils/definition";
import { PluginInitError } from "~/core/execution/plugin/errors";
import { getErrorMessage } from "~/utils/errors";

export interface Cli extends RuntimeObject<CliManifest> {
    /** The root command of the CLI */
    command?: RootCommand;
    /** Plugins applied to all commands */
    plugins: ManifestKeyedMap<Plugin>;
    /** Custom error handler called when no plugin handles the error. */
    onError?: CliErrorHandler;
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
        onError: definition.onError,
    };

    // Call onInit hooks for all plugins
    for (const plugin of pluginMap.values()) {
        if (plugin.definition.onInit) {
            try {
                await plugin.definition.onInit({ cli, plugin });
            } catch (hookError) {
                const message = getErrorMessage(hookError);
                throw new PluginInitError(`Plugin ${plugin.manifest.name} onInit hook failed: ${message}`, hookError);
            }
        }
    }

    return cli;
}
