import { defu } from "defu";
import type { UnknownRecord } from "type-fest";
import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { CommandDefinition } from "~/core/definition/command";
import {
  PluginAfterCommandExecutionError,
  PluginBeforeCommandExecutionError,
} from "~/core/execution/plugin/errors";
import { getErrorMessage } from "~/utils/execution/errors";

export async function runBeforeCommandExecutionChain(options: {
  plugins: Array<{ definition: any; manifest: { name: string } }>;
  cli: Cli;
  command: CommandDefinition;
  parsedOptions?: Record<string, any>;
  parsedPositionals?: string[];
  /** Runs middleware, validation, and handler. Receives ctx merged from preceding `execute({ ctx })` calls. */
  runAfterHooks: (pluginCtx: UnknownRecord) => Promise<void>;
}): Promise<void> {
  const { plugins, cli, command, parsedOptions, parsedPositionals, runAfterHooks } = options;

  async function runFromIndex(index: number, pluginCtx: UnknownRecord): Promise<void> {
    if (index >= plugins.length) {
      await runAfterHooks(pluginCtx);
      return;
    }

    const plugin = plugins[index]!;
    const hook = plugin.definition.onBeforeCommandExecution;

    if (!hook) {
      await runFromIndex(index + 1, pluginCtx);
      return;
    }

    let executeCalled = false;
    let tailPromise: Promise<void> | undefined;

    const execute = async (opts?: { ctx?: UnknownRecord }) => {
      if (executeCalled) {
        throw new Error("execute() called multiple times");
      }
      executeCalled = true;
      const nextCtx = defu(opts?.ctx ?? {}, pluginCtx) as UnknownRecord;
      tailPromise = runFromIndex(index + 1, nextCtx);
      await tailPromise;
    };

    try {
      await hook({
        cli,
        plugin,
        command,
        parsedOptions,
        parsedPositionals,
        execute,
      });
    } catch (hookError) {
      const message = getErrorMessage(hookError);
      throw new PluginBeforeCommandExecutionError(
        `Plugin ${plugin.manifest.name} onBeforeCommandExecution hook failed: ${message}`,
        hookError,
      );
    }

    if (executeCalled) {
      await tailPromise;
      return;
    }

    await runFromIndex(index + 1, pluginCtx);
  }

  await runFromIndex(0, {});
}

export async function executePostCommandHooks(options: {
  plugins: Array<{ definition: any; manifest: { name: string } }>;
  cli: Cli;
  command: CommandDefinition;
  commandInstance?: Command;
  data: UnknownRecord;
}): Promise<void> {
  const { plugins, cli, command, commandInstance, data } = options;

  for (const plugin of plugins) {
    if (plugin.definition.onAfterCommandExecution) {
      try {
        await plugin.definition.onAfterCommandExecution({ cli, plugin, command, data });
      } catch (hookError) {
        const message = getErrorMessage(hookError);
        const error = new PluginAfterCommandExecutionError(
          `Plugin ${plugin.manifest.name} onAfterCommandExecution hook failed: ${message}`,
          hookError,
        );

        // Plugin errors go straight to CLI onError to avoid onError-plugin loops.
        if (cli.onError) {
          try {
            await cli.onError({ error, cli, command: commandInstance });
            continue;
          } catch (handlerError) {
            console.error("CLI onError handler failed:", handlerError);
          }
        }

        // Best-effort: log but never throw.
        console.error(error);
      }
    }
  }
}
