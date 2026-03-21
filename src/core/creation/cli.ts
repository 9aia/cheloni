import type { RootCommand } from "~/core/creation/command";
import { createRootCommand } from "~/core/creation/command";
import type { Plugin } from "~/core/creation/plugin";
import { createPlugin } from "~/core/creation/plugin";
import type { CliDefinition, CliErrorHandler } from "~/core/definition/cli";
import { getCliManifest, type CliManifest } from "~/core/manifest/cli";
import type { PluginDefinition } from "~/core/definition/plugin";
import type { RuntimeObject } from "~/utils/creation/runtime-object";
import { ManifestKeyedMap } from "~/utils/definition";
import { PluginInitError } from "~/core/execution/plugin/errors";
import { getErrorMessage } from "~/utils/execution/errors";

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

    const pluginDefinitions: PluginDefinition[] = definition.plugins ?? [];

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
    await executePluginInitHooks(cli, pluginMap);

    return cli;
}

async function executePluginInitHooks(
    cli: Cli,
    pluginMap: ManifestKeyedMap<Plugin>,
): Promise<void> {
    for (const plugin of pluginMap.values()) {
        if (plugin.definition.onInit) {
            try {
                await plugin.definition.onInit({ cli, plugin });
            } catch (hookError) {
                const message = getErrorMessage(hookError);
                const error = new PluginInitError(`Plugin ${plugin.manifest.name} onInit hook failed: ${message}`, hookError);

                // Plugin errors go straight to CLI onError to avoid onError-plugin loops.
                if (cli.onError) {
                    try {
                        await cli.onError({ error, cli });
                    } catch (handlerError) {
                        console.error("CLI onError handler failed:", handlerError);
                    }
                }

                throw error;
            }
        }
    }
}
