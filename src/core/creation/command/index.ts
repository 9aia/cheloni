import type { Cli } from "~/core/creation/cli";
import type { Context } from "~/core/execution/command";
import type { InferOptionsType } from "~/core/creation/command/option";
import type { InferPositionalType } from "~/core/creation/command/positional";
import type { CommandDefinition, RootCommandDefinition } from "~/core/definition/command";
import type { OptionDefinition } from "~/core/definition/command/option";
import type { PositionalDefinition } from "~/core/definition/command/positional";
import { getCommandManifest, type CommandManifest } from "~/core/manifest/command";
import { KeyedSet, normalizeMaybeArray } from "~/lib/js";
import type { MaybePromise } from "~/lib/ts-utils";

export interface Command<
    TPositionalDefinition extends PositionalDefinition = any,
    TOptionsDefinition extends OptionDefinition = any
> {
    definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>;
    manifest: CommandManifest;
    commands: KeyedSet<Command>;
    paths: string[];
    deprecated?: boolean | string;
}

export type RootCommand<
    TPositionalDefinition extends PositionalDefinition = any,
    TOptionsDefinition extends OptionDefinition = any
> = Command<TPositionalDefinition, TOptionsDefinition>;

export interface CommandHandlerParams<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
> {
    positional: InferPositionalType<TPositionalDefinition>;
    options: InferOptionsType<TOptionsDefinition>;
    context: Context;
    command: Command;
    cli: Cli;
}

export type CommandHandler<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
> = (params: CommandHandlerParams<TPositionalDefinition, TOptionsDefinition>) => MaybePromise<void>;

export function createCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
>(
    definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>
): Command<TPositionalDefinition, TOptionsDefinition> {
    const commands = new KeyedSet<Command>(cmd => cmd.manifest.name);
    const childDefinitions = normalizeMaybeArray(definition.command);
    for (const childDef of childDefinitions) {
        commands.add(createCommand(childDef));
    }

    return {
        definition,
        manifest: getCommandManifest(definition),
        commands,
        paths: definition.paths ?? [definition.name],
        deprecated: definition.deprecated,
    };
}

export function createRootCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
>(
    definition: RootCommandDefinition<TPositionalDefinition, TOptionsDefinition>
): RootCommand<TPositionalDefinition, TOptionsDefinition> {
    return createCommand({ ...definition, name: "root" });
}

// TODO: Add support for lazy commands
//export type LazyCommand = () => Promise<Command>;
