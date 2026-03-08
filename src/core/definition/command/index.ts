import type { CommandHandler } from "~/core/creation/command";
import type { ExtrageousOptionsBehavior } from "~/core/creation/command/option";
import type { AnyMiddleware, InferComposedContext } from "~/core/creation/command/middleware";
import type { PositionalDefinition } from "~/core/definition/command/positional";
import type { OptionDefinition } from "~/core/definition/command/option";
import type { GlobalOptionDefinition } from "~/core/definition/command/global-option";
import type { PluginDefinition } from "~/core/definition/plugin";

export interface CommandDefinition<
    TPositionalDefinition extends PositionalDefinition = any,
    TOptionsDefinition extends OptionDefinition = any,
    TMiddleware extends AnyMiddleware[] = AnyMiddleware[],
> {
    name: string;
    paths?: string[];
    deprecated?: boolean | string;
    description?: string;
    positional?: TPositionalDefinition;
    options?: TOptionsDefinition;
    middleware?: [...TMiddleware];
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
    handler?: CommandHandler<TPositionalDefinition, TOptionsDefinition, InferComposedContext<TMiddleware>>;
}

export type RootCommandDefinition<
    TPositionalDefinition extends PositionalDefinition = any,
    TOptionsDefinition extends OptionDefinition = any,
    TMiddleware extends AnyMiddleware[] = AnyMiddleware[],
> = Omit<CommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddleware>, "name">;

export function defineCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition,
    TMiddleware extends AnyMiddleware[] = AnyMiddleware[],
>(
    definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddleware>,
): CommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddleware> {
    return definition;
}

export function defineRootCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition,
    TMiddleware extends AnyMiddleware[] = AnyMiddleware[],
>(
    definition: RootCommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddleware>,
): CommandDefinition<TPositionalDefinition, TOptionsDefinition, TMiddleware> {
    return {
        ...definition,
        name: "root",
    };
}
