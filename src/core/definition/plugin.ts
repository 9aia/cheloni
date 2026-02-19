import type { PluginCommandHook, PluginHook } from "~/core/creation/plugin/hook";
import type { JsonObject } from "type-fest";

export interface PluginDefinition {
    name: string;
    onInit?: PluginHook;
    onPreCommandExecution?: PluginCommandHook;
    onAfterCommandExecution?: PluginCommandHook;
    onDestroy?: PluginHook;
}

export type PluginConfig<TConfig extends JsonObject> = TConfig;
export type PluginFactory<TConfig extends PluginConfig<T>, T extends JsonObject> = (config: TConfig) => PluginDefinition;

// Overload 1: object form – returns a concrete PluginDefinition
export function definePlugin(definition: PluginDefinition): PluginDefinition

// Overload 2: factory form – returns a typed plugin factory
export function definePlugin<
    TConfig extends PluginConfig<T>,
    T extends JsonObject
>(
    factory: PluginFactory<TConfig, T>
): (config: TConfig) => PluginDefinition;

export function definePlugin<
    TConfig extends PluginConfig<T>,
    T extends JsonObject
>(
    arg: PluginDefinition | PluginFactory<TConfig, T>
): PluginDefinition | ((config: TConfig) => PluginDefinition) {
    if (typeof arg === "function") {
        // Factory form: return a callable that forwards to the user factory
        return (config: TConfig) => arg(config);
    }

    // Object form: return the definition directly for backwards compatibility
    return arg;
}
