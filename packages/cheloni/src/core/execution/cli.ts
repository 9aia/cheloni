import process from "node:process";
import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import { CommandNotFoundError, HaltError } from "~/core/execution/command/errors";
import { handleError } from "~/core/execution/command/handle-error";
import { PluginDestroyError, PluginError, PluginHookError } from "~/core/execution/plugin/errors";
import { getErrorMessage } from "~/utils/execution/errors";
import { executeCommand } from "./command";
import { resolveCommand, type CommandMatch } from "./command/router";

export interface ExecuteCliOptions {
  cli: Cli;
  args?: string[];
}

async function runErrorHandlers(cli: Cli, error: unknown, command?: Command): Promise<void> {
  // Plugin errors go straight to CLI onError to avoid onError-plugin loops.
  if (error instanceof PluginError) {
    if (cli.onError) {
      try {
        await cli.onError({ error, cli, command });
        return;
      } catch (handlerError) {
        console.error("CLI onError handler failed:", handlerError);
      }
    }
    // Fall back to default behavior if no CLI handler exists.
    if (command) {
      handleError({ error, command });
    } else {
      console.error(`Error: ${error.message}`);
    }
    return;
  }

  for (const plugin of cli.plugins.values()) {
    if (plugin.definition.onError) {
      try {
        const handled = await plugin.definition.onError({ cli, plugin, error, command });
        if (handled === true) return;
      } catch (hookError) {
        const message = getErrorMessage(hookError);
        const pluginError = new PluginHookError(
          `Plugin ${plugin.manifest.name} onError hook failed: ${message}`,
          hookError,
        );

        // Route plugin onError hook failures directly to cli.onError to avoid infinite loops.
        if (cli.onError) {
          try {
            await cli.onError({ error: pluginError, cli, command });
            // keep going so another plugin can still handle the original `error`
          } catch (handlerError) {
            console.error("CLI onError handler failed:", handlerError);
          }
        }

        // Last resort: log it but continue, so another plugin can still handle the original `error`.
        console.error(pluginError);
      }
    }
  }

  if (cli.onError) {
    try {
      await cli.onError({ error, cli, command });
      return;
    } catch (handlerError) {
      console.error("CLI onError handler failed:", handlerError);
    }
  }

  if (command) {
    handleError({ error, command });
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("An unknown error occurred");
  }
}

export async function executeCli(options: ExecuteCliOptions): Promise<void> {
  const { cli, args = process.argv.slice(2) } = options;
  let match: CommandMatch | null = null;

  try {
    // Resolve command (walks the nested command tree)
    match = resolveCommand(cli, args);

    if (!match) {
      throw new CommandNotFoundError();
    }

    await executeCommand({
      command: match.command,
      args: match.remainingArgv,
      cli,
    });
  } catch (error) {
    // HaltError is not a typical error, it is a signal to stop the execution
    if (error instanceof HaltError) {
      return;
    }

    await runErrorHandlers(cli, error, match?.command);
    process.exit(1);
  } finally {
    try {
      await executePluginDestroyHooks(cli);
    } catch (error) {
      // TODO: handle this error
      console.error("Plugin destroy hooks failed:", error);
      process.exit(1);
    }
  }
}

async function executePluginDestroyHooks(cli: Cli): Promise<void> {
  // Call onDestroy hooks for all plugins (always called, even on error)
  for (const plugin of cli.plugins.values()) {
    if (plugin.definition.onDestroy) {
      try {
        await plugin.definition.onDestroy({ cli, plugin });
      } catch (hookError) {
        const message = getErrorMessage(hookError);
        const error = new PluginDestroyError(
          `Plugin ${plugin.manifest.name} onDestroy hook failed: ${message}`,
          hookError,
        );

        // Plugin errors go straight to CLI onError to avoid onError-plugin loops.
        if (cli.onError) {
          try {
            await cli.onError({ error, cli });
            continue;
          } catch (handlerError) {
            console.error("CLI onError handler failed:", handlerError);
          }
        }

        console.error(error);
      }
    }
  }
}
