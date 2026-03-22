import { defu } from "defu";
import type { UnknownRecord } from "type-fest";
import z from "zod";
import type { Cli } from "~/core/creation/cli";
import type { Command, CommandHandlerParams } from "~/core/creation/command";
import type { AnyMiddleware } from "~/core/creation/command/middleware";
import { createPlugin } from "~/core/creation/plugin";
import {
  executePostCommandHooks,
  runBeforeCommandExecutionChain,
} from "~/core/execution/plugin/command-hooks";
import { buildAliasMap } from "~/utils/execution/alias";
import { parseArgs } from "../parser";
import { HaltError, InvalidOptionsError } from "./errors";
import {
  executeBequeathedOptionHandlers,
  type BequeathedOptionInvocation,
} from "./option-handlers";
import { executeMiddleware } from "./middleware";
import { buildOptionNames } from "./option";
import { validateOptions, validateOptionsExist, validatePositional } from "./validate";

export { halt, type HaltFunction } from "./halt";

export interface ExecuteCommandOptions {
  args: string[];
  command: Command;
  cli: Cli;
}

function collectPlugins(cli: Cli, commandDef: Command["definition"]) {
  const globalPlugins = Array.from(cli.plugins.values());
  const commandPlugins = (commandDef.plugins ?? []).map(createPlugin);
  return [...globalPlugins, ...commandPlugins];
}

async function executeMiddlewareChain(
  middleware: AnyMiddleware[] | undefined,
  cli: Cli,
  command: Command,
  ctx?: UnknownRecord,
): Promise<UnknownRecord> {
  if (!middleware?.length) {
    return ctx ? { ...ctx } : {};
  }
  return await executeMiddleware({
    middleware: middleware,
    cli,
    command,
    ctx,
  });
}

async function validateAndExecuteOptions(
  validatedOptions: Record<string, any>,
  cli: Cli,
  command: Command,
  ctx: UnknownRecord,
): Promise<UnknownRecord> {
  const invocations: BequeathedOptionInvocation[] = [];

  for (const bequeathOpt of command.bequeathOptions.values()) {
    const optName = bequeathOpt.definition.name;
    const optValue = validatedOptions[optName];

    if (optValue === undefined) {
      continue;
    }

    let parsedValue: any = optValue;
    if (bequeathOpt.definition.schema) {
      try {
        parsedValue = bequeathOpt.definition.schema.parse(optValue);
      } catch (error) {
        const zodError = error as z.ZodError;
        throw new InvalidOptionsError(
          `Invalid value for --${optName}: ${zodError.message}`,
          zodError.issues,
        );
      }
    }

    if (bequeathOpt.definition.handler) {
      invocations.push({ option: bequeathOpt, parsedValue });
    }
  }

  return executeBequeathedOptionHandlers({
    invocations,
    cli,
    command,
    initialCtx: ctx,
  });
}

export async function executeCommand(options: ExecuteCommandOptions): Promise<void> {
  const { command, args, cli } = options;
  const def = command.definition;

  const allPlugins = collectPlugins(cli, def);
  const aliasMap = buildAliasMap(def, cli, command);
  const { positional: positionalArgs, options: rawOptions } = parseArgs(args, aliasMap);

  const dataForAfter: { current: UnknownRecord } = { current: {} };

  try {
    await runBeforeCommandExecutionChain({
      plugins: allPlugins,
      cli,
      command: def,
      parsedOptions: rawOptions,
      parsedPositionals: positionalArgs,
      runAfterHooks: async (pluginCtx) => {
        dataForAfter.current = { ...pluginCtx };

        let commandCtx = await executeMiddlewareChain(def.middleware, cli, command, pluginCtx);
        dataForAfter.current = commandCtx;

        const extrageousOptionsBehavior = def.throwOnExtrageousOptions ?? "throw";
        const optionNames = buildOptionNames(cli, command);
        const validatedOptions = validateOptionsExist(
          rawOptions,
          def.options,
          extrageousOptionsBehavior,
          optionNames,
        );

        commandCtx = await validateAndExecuteOptions(validatedOptions, cli, command, commandCtx);
        dataForAfter.current = commandCtx;

        const positionalSchema = def.positional;
        const positional = validatePositional(positionalSchema, positionalArgs);

        const optionsSchema = def.options;
        const cliOptions = validateOptions(
          optionsSchema,
          validatedOptions,
          extrageousOptionsBehavior,
          command.bequeathOptions,
        );

        dataForAfter.current = defu(cliOptions as UnknownRecord, commandCtx) as UnknownRecord;

        if (def.handler) {
          const handlerParams: CommandHandlerParams<typeof positionalSchema, typeof optionsSchema> =
            {
              positional,
              options: cliOptions,
              ctx: commandCtx,
              command,
              cli,
            };
          await def.handler(handlerParams);
        }
      },
    });
  } catch (error) {
    if (error instanceof HaltError) {
      return;
    }
    throw error;
  } finally {
    await executePostCommandHooks({
      plugins: allPlugins,
      cli,
      command: def,
      commandInstance: command,
      data: dataForAfter.current,
    });
  }
}
