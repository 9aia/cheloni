import type { Command } from "~/core/creation/command";
import type { Cli } from "~/core/creation/cli";

export interface CommandMatch {
    command: Command;
    remainingArgv: string[];
}

export function findCommandByPath(commands: Iterable<Command>, path: string): Command | null {
    for (const command of commands) {
        if (command.paths) {
            for (const commandPath of command.paths) {
                if (commandPath === path) {
                    return command;
                }
            }
        }
    }
    
    return null;
}

export function resolveCommand(cli: Cli, argv: string[]): CommandMatch | null {
    const command = cli.command;

    if (!command) {
        return null;
    }

    if (argv.length === 0) {
        // No args: run the root command itself
        return {
            command,
            remainingArgv: [],
        };
    }

    // Walk the command tree consuming path segments
    let current = command;
    let remaining = argv;

    while (remaining.length > 0) {
        const firstArg = remaining[0]!;
        const isCommandPath = !firstArg.startsWith('-');

        if (!isCommandPath) {
            break;
        }

        // Try to find a matching subcommand
        const found = findCommandByPath(current.commands.values(), firstArg);
        if (found) {
            current = found;
            remaining = remaining.slice(1);
        } else {
            // No matching subcommand - stop traversal
            break;
        }
    }

    return {
        command: current,
        remainingArgv: remaining,
    };
}
