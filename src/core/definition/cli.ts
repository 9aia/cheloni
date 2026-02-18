import type { RootCommandDefinition } from "~/core/definition/command";
import type { GlobalOptionDefinition } from "~/core/definition/command/global-option";
import type { PackDefinition } from "~/core/definition/pack";
import type { PluginDefinition } from "~/core/definition/plugin";
import type { MaybeArray } from "~/lib/ts-utils";

export interface CliDefinition {
    name: string;
    version?: string;
    description?: string;
    details?: string;
    deprecated?: boolean | string;
    command?: RootCommandDefinition;
    // TODO: add lazy command
    //command?: (CommandDefinition | LazyCommandDefinition);
    globalOption?: MaybeArray<GlobalOptionDefinition>;
    // TODO: add global positional
    //globalPositional?: PositionalDefinition;
    plugin?: MaybeArray<PluginDefinition>;
    pack?: MaybeArray<PackDefinition>;
}

export function defineCli(definition: CliDefinition): CliDefinition {
    return definition;
}
