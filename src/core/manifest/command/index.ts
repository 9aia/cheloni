import type { CommandDefinition } from "~/core/definition/command";
import { getOptionsManifest, type OptionManifest } from "~/core/manifest/command/option";
import { getPositionalManifest, type PositionalManifest } from "~/core/manifest/command/positional";
import { getPluginsManifest, type PluginManifest } from "~/core/manifest/plugin";
import { normalizeMaybeArray } from "~/lib/js";
import type { MaybeArray } from "~/lib/ts-utils";

export interface CommandManifest {
    name: string;
    paths?: string[];
    deprecated?: boolean | string;
    description?: string;
    example?: MaybeArray<string>;
    options?: OptionManifest[];
    positional?: PositionalManifest;
    plugins?: PluginManifest[];
    commands?: CommandManifest[];
    details?: string;
}

export function getCommandManifest(command: CommandDefinition): CommandManifest {
    const childDefs = normalizeMaybeArray(command.command);

    return {
        name: command.name,
        paths: command.paths ?? [command.name],
        description: command.description,
        details: command.details,
        example: command.example,
        deprecated: command.deprecated,
        positional: command.positional ? getPositionalManifest(command.positional) : undefined,
        options: command.options ? getOptionsManifest(command.options) : undefined,
        plugins: command.plugin ? getPluginsManifest(command.plugin) : undefined,
        commands: childDefs.map(c => getCommandManifest(c)),
    };
}
