import type { Cli } from "~/core/creation/cli";
import type { CommandDefinition } from "~/core/definition/command";

export function showCliDeprecationWarning(cli: Cli): void {
    if (!cli.manifest.deprecated) return;

    const message = typeof cli.manifest.deprecated === "string"
        ? cli.manifest.deprecated
        : "This CLI is deprecated";

    console.warn(`Deprecated: ${message}`);
}

export function showCommandDeprecationWarning(command: CommandDefinition): void {
    if (!command.deprecated) return;

    const message = typeof command.deprecated === "string"
        ? command.deprecated
        : "This command is deprecated";

    console.warn(`Deprecated: ${message}`);
}
