import type { PluginCommandHook, PluginHook } from "~/core/creation/plugin/hook";

export interface PluginDefinition {
    name: string;
    onInit?: PluginHook;
    onPreCommandExecution?: PluginCommandHook;
    onAfterCommandExecution?: PluginCommandHook;
    onDestroy?: PluginHook;
}

export function definePlugin(definition: PluginDefinition): PluginDefinition {
    return definition;
}
