import type { ExtrageousOptionsBehavior } from "~/core/creation/command/option";
import type { CommandHandler } from "~/core/definition/command/command-handler";
import type {
  AnyMiddleware,
  InferMiddlewareArrayContext,
} from "~/core/definition/command/middleware";
import type { OptionDefinition, OptionsSchema } from "~/core/definition/command/option";
import type { PositionalDefinition } from "~/core/definition/command/positional";
import type { PluginDefinition } from "~/core/definition/plugin";

/**
 * A command definition.
 */
export interface CommandDefinition<
  TPositionalDefinition extends PositionalDefinition | undefined = undefined,
  TOptionsDefinition extends OptionsSchema | undefined = undefined,
  TMiddlewareArray extends readonly AnyMiddleware[] = readonly [],
> {
  name: string;
  paths?: string[];
  deprecated?: boolean | string;
  description?: string;
  positional?: TPositionalDefinition;
  options?: TOptionsDefinition;
  middleware?: TMiddlewareArray;
  examples?: string[];
  details?: string;
  throwOnExtrageousOptions?: ExtrageousOptionsBehavior;
  plugins?: PluginDefinition[];
  commands?: CommandDefinition<
    PositionalDefinition | undefined,
    OptionsSchema | undefined,
    readonly AnyMiddleware[]
  >[];
  /**
   * Options that are inherited by subcommands.
   * @default []
   */
  bequeathOptions?: OptionDefinition[];
  handler?: CommandHandler<
    TPositionalDefinition,
    TOptionsDefinition,
    InferMiddlewareArrayContext<TMiddlewareArray>
  >;
}

/**
 * A root command definition.
 */
export type RootCommandDefinition<
  TPositionalDefinition extends PositionalDefinition | undefined = undefined,
  TOptionsDefinition extends OptionsSchema | undefined = undefined,
  TMiddlewareArray extends readonly AnyMiddleware[] = readonly [],
> = Omit<
  CommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddlewareArray>,
  "name"
>;

/**
 * Widened command definition for CLI trees, plugin hooks, and helpers that must accept
 * any {@link defineCommand} result (positional / options / middleware shapes vary).
 */
export type AnyCommandDefinition = CommandDefinition<
  PositionalDefinition | undefined,
  OptionsSchema | undefined,
  readonly AnyMiddleware[]
>;

export type AnyRootCommandDefinition = Omit<AnyCommandDefinition, "name">;

/**
 * Defines a command.
 */
export function defineCommand<
  TPositionalDefinition extends PositionalDefinition | undefined = undefined,
  TOptionsDefinition extends OptionsSchema | undefined = undefined,
  TMiddlewareArray extends readonly AnyMiddleware[] = readonly [],
>(
  definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddlewareArray>,
): CommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddlewareArray> {
  return definition;
}

/**
 * Defines a root command.
 */
export function defineRootCommand<
  TPositionalDefinition extends PositionalDefinition | undefined = undefined,
  TOptionsDefinition extends OptionsSchema | undefined = undefined,
  TCtx extends UnknownRecord = UnknownRecord,
  TMiddlewareArray extends MiddlewareArray<TCtx> = MiddlewareArray<TCtx>,
>(
  definition: RootCommandDefinition<
    TPositionalDefinition,
    TOptionsDefinition,
    TCtx,
    TMiddlewareArray
  >,
): CommandDefinition<TPositionalDefinition, TOptionsDefinition, TCtx, TMiddlewareArray> {
  return {
    ...definition,
    name: "__root__",
  };
}
