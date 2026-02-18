import type { CliDefinition } from "~/core/definition/cli";
import type { CommandManifest } from "~/core/manifest/command";
import { getRootCommandsManifest } from "~/core/manifest/command";
import type { OptionManifest } from "~/core/manifest/command/option";
import { getOptionManifest } from "~/core/manifest/command/option";
import { getPluginManifest, type PluginManifest } from "~/core/manifest/plugin";
import { normalizeMaybeArray } from "~/lib/js";

export interface CliManifest {
    name: string;
    version?: string;
    description?: string;
    details?: string;
    deprecated?: boolean | string;
    /** The root command of the CLI */
    command?: CommandManifest;
    globalOptions?: OptionManifest[];
    // TODO: add global positional
    //globalPositional?: PositionalManifest;
    // TODO: add global commands
    //globalCommands: CommandManifest[];
    plugins?: PluginManifest[];
}

export function getCliManifest(definition: CliDefinition): CliManifest {
    const globalOptions = normalizeMaybeArray(definition.globalOption);
    const plugins = normalizeMaybeArray(definition.plugin);

    return {
        name: definition.name,
        version: definition.version,
        description: definition.description,
        details: definition.details,
        deprecated: definition.deprecated,
        plugins: plugins.map(plugin => getPluginManifest(plugin)),
        command: definition.command ? getRootCommandsManifest(definition.command) : undefined,
        globalOptions: globalOptions.map(option => getOptionManifest(option.name, option.schema)),
        // TODO: add global commands
        //globalCommands: [...cli.globalCommands].map(command => getCommandManifest(command)),
        // TODO: add global positional
        //globalPositional: cli.globalPositional ? getPositionalManifest(cli.globalPositional.schema) : undefined,
    };
}
