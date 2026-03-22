import type { UnknownRecord } from "type-fest";
import type { ExtrageousOptionsBehavior } from "~/core/creation/command/option";
import type { CommandHandler } from "~/core/definition/command/command-handler";
import type {
  InferMiddlewareArrayContext,
  MiddlewareArray,
} from "~/core/definition/command/middleware";
import type { OptionDefinition, OptionsSchema } from "~/core/definition/command/option";
import type { PositionalDefinition } from "~/core/definition/command/positional";
import type { PluginDefinition } from "~/core/definition/plugin";

/**
 * A command definition.
 */
export interface CommandDefinition<
  TPositionalDefinition extends PositionalDefinition = PositionalDefinition,
  TOptionsDefinition extends OptionsSchema = OptionsSchema,
  TCtx extends UnknownRecord = UnknownRecord,
  TMiddlewareArray extends MiddlewareArray<TCtx> = [],
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
  commands?: CommandDefinition<PositionalDefinition, OptionsSchema, UnknownRecord, []>[];
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
  TPositionalDefinition extends PositionalDefinition = PositionalDefinition,
  TOptionsDefinition extends OptionsSchema = OptionsSchema,
  TCtx extends UnknownRecord = UnknownRecord,
  TMiddlewareArray extends MiddlewareArray<TCtx> = [],
> = Omit<
  CommandDefinition<TPositionalDefinition, TOptionsDefinition, TCtx, TMiddlewareArray>,
  "name"
>;

/**
 * Defines a command.
 */
export function defineCommand<
  TPositionalDefinition extends PositionalDefinition,
  TOptionsDefinition extends OptionsSchema,
  TCtx extends UnknownRecord,
  TMiddlewareArray extends MiddlewareArray<TCtx>,
>(
  definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition, TCtx, TMiddlewareArray>,
): CommandDefinition<TPositionalDefinition, TOptionsDefinition, TCtx, TMiddlewareArray> {
  return definition;
}

/**
 * Defines a root command.
 */
export function defineRootCommand<
  TPositionalDefinition extends PositionalDefinition,
  TOptionsDefinition extends OptionsSchema,
  TCtx extends UnknownRecord,
  TMiddlewareArray extends MiddlewareArray<TCtx>,
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
