import type { PluginDefinition } from "./plugin";

export interface PluginpackDefinition {
    name: string;
    plugins: PluginDefinition[];
}

export function definePluginpack(definition: PluginpackDefinition): PluginpackDefinition {
    return definition;
}
