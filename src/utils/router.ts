import type { Command } from "~/core/creation/command";

/**
 * Find a command in the tree by name or path, starting from a given command's subcommands.
 */
export function findCommandInTree(
    command: Command,
    name: string
): Command | undefined {
    for (const child of command.commands) {
        if (child.manifest.name === name) return child;
        if (child.paths?.includes(name)) return child;
    }
    // Deep search
    for (const child of command.commands) {
        const found = findCommandInTree(child, name);
        if (found) return found;
    }
    return undefined;
}
