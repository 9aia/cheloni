import type { Command } from "~/core/creation/command";
import type { Cli } from "~/core/creation/cli";

export interface CommandMatch {
    command: Command;
    remainingArgv: string[];
}

export function findCommandByPath(cli: Cli, path: string): Command | null {
    const pathMap = new Map<string, Command>();
    
    for (const command of cli.rootCommands) {
        if (command.paths) {
            for (const commandPath of command.paths) {
                pathMap.set(commandPath, command);
            }
        }
    }
    
    return pathMap.get(path) || null;
}

export function resolveCommand(cli: Cli, argv: string[]): CommandMatch | null {
    if (cli.rootCommands.size === 0) {
        return null;
    }

    if (argv.length === 0) {
        return null;
    }

    const firstArg = argv[0];
    const isCommandPath = firstArg && !firstArg.startsWith('-');
    
    if (isCommandPath) {
        const found = findCommandByPath(cli, firstArg);
        if (found) {
            return {
                command: found,
                remainingArgv: argv.slice(1),
            };
        }
    }
    
    // Find default command (one without paths)
    let defaultCommand: Command | null = null;
    
    for (const command of cli.rootCommands) {
        if (!command.paths || command.paths.length === 0) {
            defaultCommand = command;
            break;
        }
    }
    
    // If no default command, use first command
    if (!defaultCommand && cli.rootCommands.size > 0) {
        defaultCommand = [...cli.rootCommands][0] ?? null;
    }
    
    // If a path was provided but not found, return null
    if (isCommandPath) {
        return null;
    }
    
    if (!defaultCommand) {
        return null;
    }
    
    return {
        command: defaultCommand,
        remainingArgv: argv,
    };
}
