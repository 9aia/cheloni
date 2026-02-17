import type { CliDefinition } from "~/core/definition/cli";
import { getCliManifest, type CliManifest } from "~/core/manifest/cli";
import type { Command } from "~/core/creation/command";
import { createCommand } from "~/core/creation/command";
import type { GlobalOption } from "~/core/creation/command/global-option";
import { createGlobalOption } from "~/core/creation/command/global-option";
import type { Plugin } from "~/core/creation/plugin";
import { createPlugin } from "~/core/creation/plugin";
import { KeyedSet } from "~/lib/js";
import { normalizeMaybeArray } from "~/lib/js";

export interface Cli {
    manifest: CliManifest;
    rootCommands: KeyedSet<Command>;
    // NOTE: Nested commands are intentionally not supported to prevent infinite recursion
    // If subcommands are needed, they should be defined as separate root commands
    // with different paths, or use a plugin system for command composition
    /** Subcommands available to all commands */
    // TODO: Consider lazy command loading if nested commands are needed
    //globalCommands: KeyedSet<Command>;
    /** Plugins applied to all commands */
    plugins: KeyedSet<Plugin>;
    /** Option definitions available globally */
    globalOptions: KeyedSet<GlobalOption>;
    /** Positional argument definitions available globally */
    // TODO: add global positional
    //globalPositional: Positional;
}

export async function createCli(definition: CliDefinition): Promise<Cli> {
    const manifest = getCliManifest(definition);

    const rootCommandSet = new KeyedSet<Command>(command => command.manifest.name);
    const pluginSet = new KeyedSet<Plugin>(plugin => plugin.manifest.name);
    const globalOptionsSet = new KeyedSet<GlobalOption>(globalOption => globalOption.definition.name);

    // Create commands from definitions
    const commandDefinitions = normalizeMaybeArray(definition.command);
    for (const cmdDef of commandDefinitions) {
        const command = createCommand(cmdDef);
        rootCommandSet.add(command);
    }

    // Create global options from definitions
    const globalOptionDefinitions = normalizeMaybeArray(definition.globalOption);
    for (const globalOptDef of globalOptionDefinitions) {
        const globalOption = createGlobalOption(globalOptDef);
        globalOptionsSet.add(globalOption);
    }

    // Create plugins from definitions
    const pluginDefinitions = normalizeMaybeArray(definition.plugin);
    for (const pluginDef of pluginDefinitions) {
        const plugin = createPlugin(pluginDef);
        pluginSet.add(plugin);
    }

    const cli: Cli = {
        manifest,
        rootCommands: rootCommandSet,
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
