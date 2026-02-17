import type { CommandHandler } from "~/core/creation/command";
import type { ExtrageousOptionsBehavior } from "~/core/creation/command/option";
import type { MaybeArray } from "~/lib/ts-utils";
import type { MiddlewareDefinition } from "~/core/definition/command/middleware";
import type { PositionalDefinition } from "~/core/definition/command/positional";
import type { OptionDefinition } from "~/core/definition/command/option";
import type { PluginDefinition } from "~/core/definition/plugin";

export interface CommandDefinition<
    TPositionalDefinition extends PositionalDefinition = any,
    TOptionsDefinition extends OptionDefinition = any
> {
    name: string;
    paths?: string[];
    deprecated?: boolean | string;
    description?: string;
    positional?: TPositionalDefinition;
    options?: TOptionsDefinition;
    middleware?: MaybeArray<MiddlewareDefinition>;
    example?: MaybeArray<string>;
    details?: string;
    throwOnExtrageousOptions?: ExtrageousOptionsBehavior;
    plugin?: MaybeArray<PluginDefinition>;
    handler?: CommandHandler<TPositionalDefinition, TOptionsDefinition>;
}

// TODO: Add support for lazy commands
// export type LazyCommandDefinition = () => Promise<CommandDefinition>;

export function defineCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
>(
    definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>
): CommandDefinition<TPositionalDefinition, TOptionsDefinition> {
    return definition;
}
