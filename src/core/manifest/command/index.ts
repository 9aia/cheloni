import type { CommandDefinition } from "~/core/definition/command";
import type { MaybeArray } from "~/lib/ts-utils";
import { getOptionsManifest, type OptionManifest } from "~/core/manifest/command/option";
import { getPositionalManifest, type PositionalManifest } from "~/core/manifest/command/positional";

export interface CommandManifest {
    name: string;
    paths?: string[];
    description?: string;
    details?: string;
    example?: MaybeArray<string>;
    options?: OptionManifest[];
    positional?: PositionalManifest;
    // TODO: add plugins
    //plugins?: string[];
    deprecated?: boolean | string;
}

export function getCommandManifest(command: CommandDefinition): CommandManifest {
    return {
        name: command.name,
        paths: command.paths,
        description: command.description,
        details: command.details,
        example: command.example,
        deprecated: command.deprecated,
        positional: command.positional ? getPositionalManifest(command.positional) : undefined,
        options: command.options ? getOptionsManifest(command.options) : undefined,
        // TODO: add plugins
        //plugins: command.plugins?.map(p => p.name),
    };
}
