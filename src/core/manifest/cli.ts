import type { CliDefinition } from "~/core/definition/cli";
import type { CommandManifest } from "~/core/manifest/command";
import { getRootCommandsManifest } from "~/core/manifest/command";
import { getPluginManifest, type PluginManifest } from "~/core/manifest/plugin";
import type { Manifest } from "~/utils/definition";

export interface CliManifest extends Manifest {
    version?: string;
    description?: string;
    details?: string;
    deprecated: boolean | string;
    /** The root command of the CLI */
    command?: CommandManifest;
    plugins: PluginManifest[];
}

/** CLI definition with required `name` (after optional package.json resolution). */
export type CliManifestSource = Omit<CliDefinition, "metaUrl"> & { name: string };

export function getCliManifest(definition: CliDefinition & { name: string }): CliManifest {
    return {
        name: definition.name,
        version: definition.version,
        description: definition.description,
        details: definition.details,
        deprecated: definition.deprecated ?? false,
        plugins: definition.plugins ? definition.plugins.map(plugin => getPluginManifest(plugin)) : [],
        command: definition.command ? getRootCommandsManifest(definition.command) : undefined,
    };
}
