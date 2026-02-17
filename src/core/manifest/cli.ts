import type { CommandManifest } from "~/core/manifest/command";
import { getCommandManifest } from "~/core/manifest/command";
import type { OptionManifest } from "~/core/manifest/command/option";
import { getOptionManifest } from "~/core/manifest/command/option";
import { normalizeMaybeArray } from "~/lib/js";
import type { CliDefinition } from "../definition/cli";

export interface CliManifest {
    name: string;
    version?: string;
    description?: string;
    details?: string;
    deprecated?: boolean | string;
    rootCommands?: CommandManifest[];
    // TODO: add global commands
    //globalCommands: CommandManifest[];
    globalOptions?: OptionManifest[];
    // TODO: add global positional
    //globalPositional?: PositionalManifest;
    // TODO: add plugins
    //plugins?: PluginManifest[];
}

export function getCliManifest(definition: CliDefinition): CliManifest {
    const commands = normalizeMaybeArray(definition.command);
    const globalOptions = normalizeMaybeArray(definition.globalOption);

    return {
        name: definition.name,
        version: definition.version,
        description: definition.description,
        details: definition.details,
        deprecated: definition.deprecated,
        rootCommands: commands.map(command => getCommandManifest(command)),
        // TODO: add plugins
        //plugins: [...cli.plugins].map(p => p.name),
        // TODO: add global commands
        //globalCommands: [...cli.globalCommands].map(command => getCommandManifest(command)),
        globalOptions: globalOptions.map(option => getOptionManifest(option.name, option.schema)),
        // TODO: add global positional
        //globalPositional: cli.globalPositional ? getPositionalManifest(cli.globalPositional.schema) : undefined,
    };
}
