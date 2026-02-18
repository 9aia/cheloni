import type { RootCommand } from "~/core/creation/command";
import { createRootCommand } from "~/core/creation/command";
import type { GlobalOption } from "~/core/creation/command/global-option";
import { createGlobalOption } from "~/core/creation/command/global-option";
import type { Plugin } from "~/core/creation/plugin";
import { createPlugin } from "~/core/creation/plugin";
import type { CliDefinition } from "~/core/definition/cli";
import { getCliManifest, type CliManifest } from "~/core/manifest/cli";
import { KeyedSet, normalizeMaybeArray } from "~/lib/js";
import type { PluginDefinition } from "~/core/definition/plugin";

export interface Cli {
    manifest: CliManifest;
    /** The root command of the CLI */
    command?: RootCommand;
    // TODO: Consider lazy command
    //command?: Command | LazyCommand;
    /** Plugins applied to all commands */
    plugins: KeyedSet<Plugin>;
    /** Option definitions available globally */
    globalOptions: KeyedSet<GlobalOption>;
    // TODO: Consider global commands
    //globalCommands: KeyedSet<Command>;
    /** Positional argument definitions available globally */
    // TODO: add global positional
    //globalPositional: Positional;
}

export async function createCli(definition: CliDefinition): Promise<Cli> {
    const manifest = getCliManifest(definition);

    const pluginSet = new KeyedSet<Plugin>(plugin => plugin.manifest.name);
    const globalOptionsSet = new KeyedSet<GlobalOption>(globalOption => globalOption.definition.name);

    // Create root command from definition (if provided)
    const command = definition.command ? createRootCommand(definition.command) : undefined;

    // Create global options from definitions
    const globalOptionDefinitions = normalizeMaybeArray(definition.globalOption);
    for (const globalOptDef of globalOptionDefinitions) {
        const globalOption = createGlobalOption(globalOptDef);
        globalOptionsSet.add(globalOption);
    }

    // Create plugins from definitions and packs
    const pluginDefinitions: PluginDefinition[] = [];
    
    // Add plugins from plugin field
    if (definition.plugin) {
        pluginDefinitions.push(...normalizeMaybeArray(definition.plugin));
    }
    
    // Add plugins from pack field
    if (definition.pack) {
        const packDefinitions = normalizeMaybeArray(definition.pack);
        for (const packDef of packDefinitions) {
            pluginDefinitions.push(...normalizeMaybeArray(packDef.plugin));
        }
    }
    
    for (const pluginDef of pluginDefinitions) {
        const plugin = createPlugin(pluginDef);
        pluginSet.add(plugin);
    }

    const cli: Cli = {
        manifest,
        command,
        plugins: pluginSet,
        globalOptions: globalOptionsSet,
    };

    // Call onInit hooks for all plugins
    for (const plugin of pluginSet) {
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
