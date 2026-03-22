import type {
  PluginAfterCommandHook,
  PluginBeforeCommandHook,
  PluginErrorHook,
  PluginHook,
} from "~/core/creation/plugin/hook";
import type { JsonObject } from "type-fest";

export interface PluginDefinition {
  name: string;
  /** Hook that runs once CLI is created. */
  onInit?: PluginHook;
  /** Hook that runs before a command is executed. */
  onBeforeCommandExecution?: PluginBeforeCommandHook;
  /** Hook that runs after a command is executed. */
  onAfterCommandExecution?: PluginAfterCommandHook;
  /** Hook that runs when any error occurs in the CLI. Return `true` to mark it as handled. */
  onError?: PluginErrorHook;
  /** Hook that runs once CLI is destroyed. */
  onDestroy?: PluginHook;
}

export type PluginConfig<TConfig extends JsonObject> = TConfig;

export type PluginFactory<TConfig extends PluginConfig<T>, T extends JsonObject> = (
  config: TConfig,
) => PluginDefinition;

/**
 * @example
 * const plugin = definePlugin({
 *   name: "my-plugin",
 *   onInit: ({ cli }) => {
 *     console.log("Plugin initialized");
 *   }
 * });
 *
 * createCli({
 *   plugins: [plugin],
 * });
 */
export function definePlugin(definition: PluginDefinition): PluginDefinition;

/**
 * @example
 * interface Config {
 *   myOption: string;
 * }
 * const myPlugin = definePlugin<Config>((config) => ({
 *   name: "my-plugin",
 *   onInit: ({ cli }) => {
 *     console.log("Plugin initialized", config.myOption);
 *   }
 * }));
 *
 * createCli({
 *   plugins: [myPlugin({ myOption: "myValue" })],
 * });
 */
export function definePlugin<TConfig extends PluginConfig<T>, T extends JsonObject>(
  factory: PluginFactory<TConfig, T>,
): (config: TConfig) => PluginDefinition;

export function definePlugin<TConfig extends PluginConfig<T>, T extends JsonObject>(
  arg: PluginDefinition | PluginFactory<TConfig, T>,
): PluginDefinition | ((config: TConfig) => PluginDefinition) {
  if (typeof arg === "function") {
    // Factory form: return a callable that forwards to the user factory
    return (config: TConfig) => arg(config);
  }

  // Object form: return the definition directly for backwards compatibility
  return arg;
}
