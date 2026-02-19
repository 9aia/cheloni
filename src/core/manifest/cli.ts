import type { CliDefinition } from "~/core/definition/cli";
import type { CommandManifest } from "~/core/manifest/command";
import { getRootCommandsManifest } from "~/core/manifest/command";
import type { OptionManifest } from "~/core/manifest/command/option";
import { getOptionManifest } from "~/core/manifest/command/option";
import { getPluginManifest, type PluginManifest } from "~/core/manifest/plugin";
import type { Manifest } from "~/utils/definition";

export interface CliManifest extends Manifest {
    version?: string;
    description?: string;
    details?: string;
    deprecated?: boolean | string;
    /** The root command of the CLI */
    command?: CommandManifest;
    plugins?: PluginManifest[];
}

export function getCliManifest(definition: CliDefinition): CliManifest {
    const plugins = definition.plugins ?? [];

    return {
        name: definition.name,
        version: definition.version,
        description: definition.description,
        details: definition.details,
        deprecated: definition.deprecated,
        plugins: plugins.map(plugin => getPluginManifest(plugin)),
        command: definition.command ? getRootCommandsManifest(definition.command) : undefined,
    };
}
