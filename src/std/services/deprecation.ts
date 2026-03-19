import type { Cli } from "~/core/creation/cli";
import type { CommandDefinition } from "~/core/definition/command";
import { extractPositionalValue } from "~/core/execution/parser";
import { getOptionManifest } from "~/core/manifest/command/option";
import { getPositionalManifest } from "~/core/manifest/command/positional";

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

export function showOptionDeprecationWarnings(
    command: CommandDefinition,
    parsedOptions: Record<string, any> | undefined,
): void {
    if (!parsedOptions) return;

    const shape = command.options?.shape;
    if (shape) {
        for (const [optName, optSchema] of Object.entries(shape)) {
            if (parsedOptions[optName] === undefined) continue;
            const deprecated = getOptionManifest(optName, optSchema).deprecated;
            if (!deprecated) continue;
            const message = typeof deprecated === "string" ? deprecated : "This option is deprecated";
            console.warn(`Deprecated: --${optName}: ${message}`);
        }
    }
}

export function showPositionalDeprecationWarning(
    command: CommandDefinition,
    parsedPositionals: string[] | undefined,
): void {
    const schema = command.positional;
    if (!schema) return;
    if (!parsedPositionals || parsedPositionals.length === 0) return;

    const value = extractPositionalValue(schema, parsedPositionals, 0);
    if (value === undefined) return;

    const deprecated = getPositionalManifest(schema)?.deprecated;
    if (!deprecated) return;

    const message = typeof deprecated === "string" ? deprecated : "This positional argument is deprecated";
    console.warn(`Deprecated: ${message}`);
}
