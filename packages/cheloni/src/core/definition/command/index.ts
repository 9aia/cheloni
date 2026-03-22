import type { UnknownRecord } from "type-fest";
import type { ExtrageousOptionsBehavior } from "~/core/creation/command/option";
import type { CommandHandler } from "~/core/definition/command/command-handler";
import type {
  AnyMiddleware,
  InferMiddlewareArrayContext,
} from "~/core/definition/command/middleware";
import type { OptionDefinition, OptionsSchema } from "~/core/definition/command/option";
import type { PositionalDefinition } from "~/core/definition/command/positional";
import type { PluginDefinition } from "~/core/definition/plugin";

type CommandHandlerCtx<TMiddleware extends readonly AnyMiddleware[]> =
  InferMiddlewareArrayContext<TMiddleware>;

/**
 * A command definition.
 */
export interface CommandDefinition<
  TPositionalDefinition extends PositionalDefinition = PositionalDefinition,
  TOptionsDefinition extends OptionsSchema = OptionsSchema,
  TMiddleware extends readonly AnyMiddleware[] = [],
> {
  name: string;
  paths?: string[];
  deprecated?: boolean | string;
  description?: string;
  positional?: TPositionalDefinition;
  options?: TOptionsDefinition;
  middleware?: [...TMiddleware];
  examples?: string[];
  details?: string;
  throwOnExtrageousOptions?: ExtrageousOptionsBehavior;
  plugins?: PluginDefinition[];
  commands?: CommandDefinition[];
  /**
   * Options that are inherited by subcommands.
   * @default []
   */
  bequeathOptions?: OptionDefinition[];
  handler?: CommandHandler<
    TPositionalDefinition,
    TOptionsDefinition,
    CommandHandlerCtx<TMiddleware>
  >;
}

/**
 * A root command definition.
 */
export type RootCommandDefinition<
  TPositionalDefinition extends PositionalDefinition = PositionalDefinition,
  TOptionsDefinition extends OptionsSchema = OptionsSchema,
  TMiddleware extends readonly AnyMiddleware[] = [],
> = Omit<CommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddleware>, "name">;

/**
 * Defines a command.
 */
export function defineCommand<
  TPositionalDefinition extends PositionalDefinition,
  TOptionsDefinition extends OptionsSchema,
  TMiddleware extends readonly AnyMiddleware[] = [],
>(
  definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddleware>,
): CommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddleware> {
  return definition;
}

/**
 * Defines a root command.
 */
export function defineRootCommand<
  TPositionalDefinition extends PositionalDefinition,
  TOptionsDefinition extends OptionsSchema,
  TMiddleware extends readonly AnyMiddleware[] = [],
>(
  definition: RootCommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddleware>,
): CommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddleware> {
  return {
    ...definition,
    name: "__root__",
  };
}
