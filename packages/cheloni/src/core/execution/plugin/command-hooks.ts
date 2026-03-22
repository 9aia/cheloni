import { defu } from "defu";
import type { UnknownRecord } from "type-fest";
import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { CommandDefinition } from "~/core/definition/command";
import { HaltError } from "~/core/execution/command/errors";
import { halt } from "~/core/execution/command/halt";
import {
  PluginAfterCommandExecutionError,
  PluginCommandExecutionError,
} from "~/core/execution/plugin/errors";
import { getErrorMessage } from "~/utils/execution/errors";

async function reportPostExecuteHookFailure(options: {
  cli: Cli;
  pluginName: string;
  hookError: unknown;
  command?: Command;
}): Promise<void> {
  const { cli, pluginName, hookError, command } = options;
  const message = getErrorMessage(hookError);
  const error = new PluginAfterCommandExecutionError(
    `Plugin ${pluginName} onCommandExecution failed after execute(): ${message}`,
    hookError,
  );

  if (cli.onError) {
    try {
      await cli.onError({ error, cli, command });
      return;
    } catch (handlerError) {
      console.error("CLI onError handler failed:", handlerError);
    }
  }

  console.error(error);
}

export async function runCommandExecutionChain(options: {
  plugins: Array<{ definition: any; manifest: { name: string } }>;
  cli: Cli;
  commandDefinition: CommandDefinition;
  command: Command;
  parsedOptions?: Record<string, any>;
  parsedPositionals?: string[];
  /** Runs middleware, validation, and handler. Receives ctx merged from preceding `execute({ ctx })` calls. */
  runAfterHooks: (pluginCtx: UnknownRecord) => Promise<UnknownRecord>;
}): Promise<UnknownRecord> {
  const {
    plugins,
    cli,
    commandDefinition,
    command,
    parsedOptions,
    parsedPositionals,
    runAfterHooks,
  } = options;

  async function runFromIndex(index: number, pluginCtx: UnknownRecord): Promise<UnknownRecord> {
    if (index >= plugins.length) {
      return await runAfterHooks(pluginCtx);
    }

    const plugin = plugins[index]!;
    const hook = plugin.definition.onCommandExecution;

    if (!hook) {
      return await runFromIndex(index + 1, pluginCtx);
    }

    let executeCalled = false;
    let reachedPostExecute = false;
    let lastCtx: UnknownRecord | undefined;

    const execute = async (opts?: { ctx?: UnknownRecord }) => {
      if (executeCalled) {
        throw new Error("execute() called multiple times");
      }
      executeCalled = true;
      const nextCtx = defu(opts?.ctx ?? {}, pluginCtx) as UnknownRecord;
      lastCtx = await runFromIndex(index + 1, nextCtx);
      reachedPostExecute = true;
      return lastCtx;
    };

    try {
      const hookReturn = await hook({
        cli,
        plugin,
        commandDefinition,
        parsedOptions,
        parsedPositionals,
        execute,
        halt,
      });

      if (!executeCalled) {
        throw new PluginCommandExecutionError(
          `Plugin ${plugin.manifest.name} onCommandExecution must return execute(...) or halt()`,
        );
      }

      return (hookReturn ?? lastCtx) as UnknownRecord;
    } catch (hookError) {
      if (hookError instanceof HaltError) {
        throw hookError;
      }
      if (reachedPostExecute && lastCtx !== undefined) {
        const msg = getErrorMessage(hookError);
        // Second `execute()` call throws after the first completed — not teardown after a successful pipeline.
        if (msg === "execute() called multiple times") {
          throw new PluginCommandExecutionError(
            `Plugin ${plugin.manifest.name} onCommandExecution hook failed: ${msg}`,
            hookError,
          );
        }
        await reportPostExecuteHookFailure({
          cli,
          pluginName: plugin.manifest.name,
          hookError,
          command,
        });
        return lastCtx;
      }
      const message = getErrorMessage(hookError);
      throw new PluginCommandExecutionError(
        `Plugin ${plugin.manifest.name} onCommandExecution hook failed: ${message}`,
        hookError,
      );
    }
  }

  return await runFromIndex(0, {});
}
