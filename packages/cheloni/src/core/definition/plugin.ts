import type {
  PluginCommandExecutionHook,
  PluginCommandExecutionHookParams,
  PluginErrorHook,
  PluginExecuteFunction,
  PluginHook,
} from "~/core/creation/plugin/hook";
import type { JsonObject, Promisable, UnknownRecord } from "type-fest";
export interface PluginDefinition<TCtx extends UnknownRecord = UnknownRecord> {
  name: string;
  /** Hook that runs once CLI is created. */
  onInit?: PluginHook;
  /**
   * Wrap command execution: run setup, `const ctx = await execute({ ctx })`, then teardown.
   * `execute` runs remaining plugin hooks, then middleware, validation, and the handler.
   */
  onCommandExecution?: PluginCommandExecutionHook<TCtx>;
  /** Hook that runs when any error occurs in the CLI. Return `true` to mark it as handled. */
  onError?: PluginErrorHook;
  /** Hook that runs once CLI is destroyed. */
  onDestroy?: PluginHook;
}

export type PluginConfig<TConfig extends JsonObject> = TConfig;

export type PluginFactory<TConfig extends PluginConfig<T>, T extends JsonObject> = (
  config: TConfig,
) => PluginDefinition;

/** Params for {@link definePluginCommandExecutionHook}: `execute` is typed like middleware `next`. */
export type DefinePluginCommandExecutionHookParams = Omit<
  PluginCommandExecutionHookParams<UnknownRecord>,
  "execute"
> & {
  execute: PluginExecuteFunction<{}>;
};

/**
 * Defines an `onCommandExecution` hook with `execute` inference (same idea as {@link defineMiddleware} / `next({ ctx })`).
 *
 * ```ts
 * definePlugin({
 *   name: "time",
 *   onCommandExecution: definePluginCommandExecutionHook(async ({ execute }) => {
 *     const ctx = await execute({ ctx: { startTime: Date.now() } });
 *     // ctx.startTime is typed
 *     return ctx;
 *   }),
 * });
 * ```
 */
export function definePluginCommandExecutionHook(
  hook: (params: DefinePluginCommandExecutionHookParams) => Promisable<UnknownRecord | void>,
): PluginCommandExecutionHook<UnknownRecord> {
  return hook as PluginCommandExecutionHook<UnknownRecord>;
}

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
