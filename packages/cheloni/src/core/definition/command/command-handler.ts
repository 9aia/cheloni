import type { PositionalDefinition } from "~/core/definition/command/positional";
import type { OptionsSchema } from "~/core/definition/command/option";
import type { UnknownRecord } from "type-fest";
import type { Promisable } from "type-fest";
import type { CommandHandlerParams } from "~/core/creation/command";

export type CommandHandler<
  TPositionalDefinition extends PositionalDefinition,
  TOptionsDefinition extends OptionsSchema,
  TCtx extends UnknownRecord,
> = (
  params: CommandHandlerParams<TPositionalDefinition, TOptionsDefinition, TCtx>,
) => Promisable<void>;

export function defineCommandHandler<
  TPositionalDefinition extends PositionalDefinition,
  TOptionsDefinition extends OptionsSchema,
  TCtx extends UnknownRecord,
>(
  handler: CommandHandler<TPositionalDefinition, TOptionsDefinition, TCtx>,
): CommandHandler<TPositionalDefinition, TOptionsDefinition, TCtx> {
  return handler;
}
