import type { CommandDefinition, RootCommandDefinition } from "~/core/definition/command";
import { getOptionsManifest, type OptionManifest } from "~/core/manifest/command/option";
import { getPositionalManifest, type PositionalManifest } from "~/core/manifest/command/positional";
import { getPluginsManifest, type PluginManifest } from "~/core/manifest/plugin";
import type { Manifest } from "~/utils/definition";

export interface CommandManifest extends Manifest {
    paths?: string[];
    deprecated?: boolean | string;
    description?: string;
    examples?: string[];
    options?: OptionManifest[];
    positional?: PositionalManifest;
    plugins?: PluginManifest[];
    commands?: CommandManifest[];
    details?: string;
}

export function getCommandManifest(definition: CommandDefinition): CommandManifest {
    return {
        name: definition.name,
        paths: definition.paths ?? [definition.name],
        description: definition.description,
        details: definition.details,
        examples: definition.examples,
        deprecated: definition.deprecated,
        positional: definition.positional ? getPositionalManifest(definition.positional) : undefined,
        options: definition.options ? getOptionsManifest(definition.options) : undefined,
        plugins: definition.plugins ? getPluginsManifest(definition.plugins) : undefined,
        commands: (definition.commands ?? []).map(c => getCommandManifest(c)),
    };
}

export interface RootCommandManifest extends CommandManifest {
    name: "root"
}

export function getRootCommandsManifest(command: RootCommandDefinition): RootCommandManifest {
    return {
        ...getCommandManifest({
            ...command,
            name: "root",
        }),
        name: "root" as const,
    };
}
