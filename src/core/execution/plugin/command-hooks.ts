import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { CommandDefinition } from "~/core/definition/command";
import { PluginAfterCommandExecutionError, PluginBeforeCommandExecutionError } from "~/core/execution/plugin/errors";
import { getErrorMessage } from "~/utils/execution/errors";

export async function executeBeforeCommandHooks(options: {
    plugins: Array<{ definition: any; manifest: { name: string } }>;
    cli: Cli;
    command: CommandDefinition;
    parsedOptions?: Record<string, any>;
}): Promise<void> {
    const { plugins, cli, command, parsedOptions } = options;

    for (const plugin of plugins) {
        if (plugin.definition.onBeforeCommandExecution) {
            try {
                await plugin.definition.onBeforeCommandExecution({
                    cli,
                    plugin,
                    command,
                    parsedOptions,
                });
            } catch (hookError) {
                const message = getErrorMessage(hookError);
                throw new PluginBeforeCommandExecutionError(
                    `Plugin ${plugin.manifest.name} onBeforeCommandExecution hook failed: ${message}`,
                    hookError,
                );
            }
        }
    }
}

export async function executePostCommandHooks(options: {
    plugins: Array<{ definition: any; manifest: { name: string } }>;
    cli: Cli;
    command: CommandDefinition;
    commandInstance?: Command;
}): Promise<void> {
    const { plugins, cli, command, commandInstance } = options;

    for (const plugin of plugins) {
        if (plugin.definition.onAfterCommandExecution) {
            try {
                await plugin.definition.onAfterCommandExecution({ cli, plugin, command });
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
