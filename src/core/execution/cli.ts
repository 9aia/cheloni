import process from "node:process";
import type { Cli } from "~/core/creation/cli";
import { handleError } from "~/core/execution/command/handle-error";
import { HaltError } from "~/core/execution/command/errors";
import { executeCommand } from "./command";
import { resolveCommand } from "./command/router";

export interface ExecuteCliOptions {
    cli: Cli;
    args?: string[];
}

export async function executeCli(options: ExecuteCliOptions): Promise<void> {
    const { cli, args = process.argv.slice(2) } = options;
    
    try {
        // Show deprecation warning if CLI is deprecated
        if (cli.manifest.deprecated) {
            const message = typeof cli.manifest.deprecated === 'string' 
                ? cli.manifest.deprecated 
                : 'This CLI is deprecated';
            console.warn(`Deprecated: ${message}`);
        }
        
        // Resolve command (walks the nested command tree)
        const match = resolveCommand(cli, args);
        
        if (!match) {
            console.error("No command found");
            process.exit(1);
        }

        // Show deprecation warning if command is deprecated
        if (match.command.deprecated) {
            const message = typeof match.command.deprecated === 'string' 
                ? match.command.deprecated 
                : 'This command is deprecated';
            console.warn(`Deprecated: ${message}`);
        }

        // Execute command with error handling
        try {
            await executeCommand({
                command: match.command,
                args: match.remainingArgv,
                cli,
            });
        } catch (error) {
            // HaltError is not an error - it's a normal way to short-circuit execution
            if (error instanceof HaltError) {
                return;
            }
            handleError({ error, command: match.command });
            process.exit(1);
        }
    } catch (error) {
        // Top-level error handler for unexpected errors (e.g., from command resolution)
        if (error instanceof Error) {
            console.error(`Unexpected error: ${error.message}`);
        } else {
            console.error("An unexpected error occurred");
        }
        process.exit(1);
    } finally {
        // Call onDestroy hooks for all plugins (always called, even on error)
        for (const plugin of cli.plugins) {
            if (plugin.definition.onDestroy) {
                try {
                    await plugin.definition.onDestroy({ cli, plugin });
                } catch (hookError) {
                    // Log hook errors but don't throw
                    console.error(`Plugin ${plugin.manifest.name} onDestroy hook failed:`, hookError);
                }
            }
        }
    }
}
