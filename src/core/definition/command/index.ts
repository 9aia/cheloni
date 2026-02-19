import type { CommandHandler } from "~/core/creation/command";
import type { ExtrageousOptionsBehavior } from "~/core/creation/command/option";
import type { MiddlewareDefinition } from "~/core/definition/command/middleware";
import type { PositionalDefinition } from "~/core/definition/command/positional";
import type { OptionDefinition } from "~/core/definition/command/option";
import type { GlobalOptionDefinition } from "~/core/definition/command/global-option";
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
    middleware?: MiddlewareDefinition[];
    examples?: string[];
    details?: string;
    throwOnExtrageousOptions?: ExtrageousOptionsBehavior;
    plugins?: PluginDefinition[];
    commands?: CommandDefinition[];
    /**
     * Options that are inherited by subcommands.
     * @default []
     */
    bequeathOptions?: GlobalOptionDefinition[];
    handler?: CommandHandler<TPositionalDefinition, TOptionsDefinition>;
}

export type RootCommandDefinition<
TPositionalDefinition extends PositionalDefinition = any,
TOptionsDefinition extends OptionDefinition = any
> = Omit<CommandDefinition<TPositionalDefinition, TOptionsDefinition>, "name">;

export function defineCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
>(
    definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>
): CommandDefinition<TPositionalDefinition, TOptionsDefinition> {
    return definition;
}

export function defineRootCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
>(
    definition: RootCommandDefinition<TPositionalDefinition, TOptionsDefinition>
): CommandDefinition<TPositionalDefinition, TOptionsDefinition> {
    return {
        ...definition,
        name: "root",
    };
}
