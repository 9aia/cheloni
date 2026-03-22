import type { UnknownRecord } from "type-fest";
import type { Cli } from "~/core/creation/cli";
import type { InferOptionsType, Option } from "~/core/creation/command/option";
import { createOption } from "~/core/creation/command/option";
import type { InferPositionalType } from "~/core/creation/command/positional";
import type { CommandDefinition, RootCommandDefinition } from "~/core/definition/command";
import type { MiddlewareArray } from "~/core/definition/command/middleware";
import type { OptionsSchema } from "~/core/definition/command/option";
import type { PositionalDefinition } from "~/core/definition/command/positional";
import { getCommandManifest, type CommandManifest } from "~/core/manifest/command";
import type { RuntimeObject } from "~/utils/creation/runtime-object";
import { ManifestKeyedMap } from "~/utils/definition";

export interface Command<
  TPositionalDefinition extends PositionalDefinition | undefined = PositionalDefinition | undefined,
  TOptionsDefinition extends OptionsSchema | undefined = OptionsSchema | undefined,
  TCtx extends UnknownRecord = UnknownRecord,
  TMiddlewareArray extends MiddlewareArray<TCtx> = MiddlewareArray<TCtx>,
> extends RuntimeObject<CommandManifest> {
  definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition, TCtx, TMiddlewareArray>;
  commands: ManifestKeyedMap<Command>;
  paths: string[];
  /**
   * Options that are inherited by subcommands.
   * @default []
   */
  bequeathOptions: ManifestKeyedMap<Option>;
}

export type RootCommand<
  TPositionalDefinition extends PositionalDefinition | undefined = PositionalDefinition | undefined,
  TOptionsDefinition extends OptionsSchema | undefined = OptionsSchema | undefined,
  TCtx extends UnknownRecord = UnknownRecord,
  TMiddlewareArray extends MiddlewareArray<TCtx> = MiddlewareArray<TCtx>,
> = Command<TPositionalDefinition, TOptionsDefinition, TCtx, TMiddlewareArray>;

export interface CommandHandlerParams<
  TPositionalDefinition extends PositionalDefinition | undefined = undefined,
  TOptionsDefinition extends OptionsSchema | undefined = undefined,
  TContext extends UnknownRecord = UnknownRecord,
> {
  positional: InferPositionalType<TPositionalDefinition>;
  options: InferOptionsType<TOptionsDefinition>;
  ctx: TContext;
  command: Command;
  cli: Cli;
}

export function createCommand<
  TPositionalDefinition extends PositionalDefinition | undefined = undefined,
  TOptionsDefinition extends OptionsSchema | undefined = undefined,
  TCtx extends UnknownRecord = UnknownRecord,
  TMiddlewareArray extends MiddlewareArray<TCtx> = MiddlewareArray<TCtx>,
>(
  definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition, TCtx, TMiddlewareArray>,
  inheritedBequeathOptions: Option[] = [],
): Command<TPositionalDefinition, TOptionsDefinition, TCtx, TMiddlewareArray> {
  // Collect bequeathOptions from this command definition
  const bequeathOptionsMap = new ManifestKeyedMap<Option>();

  // Add inherited bequeathOptions from parent commands
  for (const inheritedOpt of inheritedBequeathOptions) {
    bequeathOptionsMap.set(inheritedOpt);
  }

  // Add this command's own bequeathOptions (they override inherited ones if same name)
  for (const bequeathOptDef of definition.bequeathOptions ?? []) {
    const bequeathOption = createOption(bequeathOptDef);
    bequeathOptionsMap.set(bequeathOption);
  }

  // Collect all bequeathOptions to pass to children
  const allBequeathOptions = Array.from(bequeathOptionsMap.values());

  const commands = new ManifestKeyedMap<Command>();
  for (const childDef of definition.commands ?? []) {
    const childCommand = createCommand(childDef, allBequeathOptions);
    commands.set(childCommand);
  }

  const resolvedPaths =
    definition.paths !== undefined && definition.paths !== null
      ? definition.paths
      : definition.name === "__root__"
        ? []
        : [definition.name];

  return {
    definition,
    manifest: getCommandManifest(definition),
    commands,
    paths: resolvedPaths,
    bequeathOptions: bequeathOptionsMap,
  };
}

export function createRootCommand<
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
): RootCommand<TPositionalDefinition, TOptionsDefinition, TCtx, TMiddlewareArray> {
  return createCommand({
    ...definition,
    name: "__root__",
  });
}
