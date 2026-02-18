import type { CommandDefinition, RootCommandDefinition } from "~/core/definition/command";
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

export function getCommandManifest(definition: CommandDefinition): CommandManifest {
    const childDefs = normalizeMaybeArray(definition.command);

    return {
        name: definition.name,
        paths: definition.paths ?? [definition.name],
        description: definition.description,
        details: definition.details,
        example: definition.example,
        deprecated: definition.deprecated,
        positional: definition.positional ? getPositionalManifest(definition.positional) : undefined,
        options: definition.options ? getOptionsManifest(definition.options) : undefined,
        plugins: definition.plugin ? getPluginsManifest(definition.plugin) : undefined,
        commands: childDefs.map(c => getCommandManifest(c)),
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
