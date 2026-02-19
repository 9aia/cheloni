import type { RootCommandDefinition } from "~/core/definition/command";
import type { PluginpackDefinition } from "~/core/definition/pack";
import type { PluginDefinition } from "~/core/definition/plugin";

export interface CliDefinition {
    name: string;
    version?: string;
    description?: string;
    details?: string;
    deprecated?: boolean | string;
    command?: RootCommandDefinition;
    plugins?: PluginDefinition[];
    pluginpacks?: PluginpackDefinition[];
}

export function defineCli(definition: CliDefinition): CliDefinition {
    return definition;
}
