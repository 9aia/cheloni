import type z from "zod";
import type { Cli } from "~/core/creation/cli";
import type { MiddlewareData } from "~/core/creation/command/middleware";
import type { InferOptionsType } from "~/core/creation/command/option";
import type { InferPositionalType } from "~/core/creation/command/positional";
import type { CommandDefinition } from "~/core/definition/command";
import { getCommandManifest, type CommandManifest } from "~/core/manifest/command";
import type { MaybePromise } from "~/lib/ts-utils";
import type { OptionDefinition } from "../../definition/command/option";
import type { PositionalDefinition } from "../../definition/command/positional";

export type CommandHandlerContext<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
> = {
    positional: InferPositionalType<TPositionalDefinition>;
    options: InferOptionsType<TOptionsDefinition>;
    data: MiddlewareData;
    command: Command;
    cli: Cli;
};

export type CommandHandler<
    TPositional extends z.ZodTypeAny | undefined,
    TOptions extends z.ZodTypeAny | undefined
> = (context: CommandHandlerContext<TPositional, TOptions>) => MaybePromise<void>;

// export interface CreateHandlerContextOptions<
//     TPositional extends z.ZodTypeAny | undefined,
//     TOptions extends z.ZodTypeAny | undefined
// > {
//     command: Command;
//     args: string[];
//     data?: MiddlewareData;
//     cliManifest: CliManifest;
// }

// export function createHandlerContext<
//     TPositional extends z.ZodTypeAny | undefined,
//     TOptions extends z.ZodTypeAny | undefined
// >(options: CreateHandlerContextOptions<TPositional, TOptions>): CommandHandlerContext<TPositional, TOptions> {
//     // This function is deprecated - use executeCommand from execution layer instead
//     // Keeping for backwards compatibility
//     throw new Error("createHandlerContext should not be called directly. Use executeCommand from execution layer.");
// }

export interface Command<
    TPositionalDefinition extends PositionalDefinition = any,
    TOptionsDefinition extends OptionDefinition = any
> {
    definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>;
    manifest: CommandManifest;
    paths?: string[];
    deprecated?: boolean | string;
}

export function createCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
>(
    definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>
): Command<TPositionalDefinition, TOptionsDefinition> {
    return {
        definition,
        manifest: getCommandManifest(definition),
        paths: definition.paths,
        deprecated: definition.deprecated,
    };
}

// TODO: Add support for lazy commands
//export type LazyCommand = () => Promise<Command>;
