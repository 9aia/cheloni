import type { PluginCommandHook, PluginHook } from "~/core/creation/plugin/hook";

export interface PluginDefinition {
    name: string;
    onInit?: PluginHook;
    onBeforeCommand?: PluginCommandHook;
    onAfterCommand?: PluginCommandHook;
    onDestroy?: PluginHook;
}

export function definePlugin(definition: PluginDefinition): PluginDefinition {
    return definition;
}
