import type { UnknownRecord } from "type-fest";
import z from "zod";
import type { Cli } from "~/core/creation/cli";
import type { Command, CommandHandlerParams } from "~/core/creation/command";
import type { AnyMiddleware } from "~/core/creation/command/middleware";
import { createOption } from "~/core/creation/command/option";
import { createPlugin } from "~/core/creation/plugin";
import { executeBeforeCommandHooks, executePostCommandHooks } from "~/core/execution/plugin/command-hooks";
import { buildAliasMap } from "~/utils/execution/alias";
import { parseArgs } from "../parser";
import { HaltError, InvalidOptionsError } from "./errors";
import { halt } from "./halt";
import { executeMiddleware } from "./middleware";
import { buildOptionNames } from "./option";
import { validateOptions, validateOptionsExist, validatePositional } from "./validate";

export { halt, type HaltFunction } from "./halt";

export interface ExecuteCommandOptions {
    args: string[];
    command: Command;
    cli: Cli;
}

function collectPlugins(cli: Cli, commandDef: Command["definition"]) {
    const globalPlugins = Array.from(cli.plugins.values());
    const commandPlugins = (commandDef.plugins ?? []).map(createPlugin);
    return [...globalPlugins, ...commandPlugins];
}

async function executeMiddlewareChain(
    middleware: AnyMiddleware[] | undefined,
    cli: Cli,
    command: Command,
): Promise<UnknownRecord> {
    if (!middleware) return {};
    return await executeMiddleware({
        middleware: middleware,
        cli,
        command,
    });
}

async function validateAndExecuteOptions(
    validatedOptions: Record<string, any>,
    cli: Cli,
    command: Command,
    context: UnknownRecord,
): Promise<void> {
    // Process bequeathOptions from parent commands
    for (const bequeathOpt of command.bequeathOptions.values()) {
        const optName = bequeathOpt.definition.name;
        const optValue = validatedOptions[optName];
        
        if (optValue === undefined) {
            continue;
        }
        
        let parsedValue: any = optValue;
        if (bequeathOpt.definition.schema) {
            try {
                parsedValue = bequeathOpt.definition.schema.parse(optValue);
            } catch (error) {
                const zodError = error as z.ZodError;
                throw new InvalidOptionsError(
                    `Invalid value for --${optName}: ${zodError.message}`,
                    zodError.issues
                );
            }
        }
        
        if (bequeathOpt.definition.handler) {
            const option = createOption(bequeathOpt.definition);
            await bequeathOpt.definition.handler({
                value: parsedValue,
                option,
                command,
                cli,
                context,
                halt,
            });
        }
    }
}

export async function executeCommand(options: ExecuteCommandOptions): Promise<void> {
    const { command, args, cli } = options;
    const def = command.definition;
    
    const allPlugins = collectPlugins(cli, def);
    const aliasMap = buildAliasMap(def, cli, command);
    const { positional: positionalArgs, options: rawOptions } = parseArgs(args, aliasMap);
    
    try {
        await executeBeforeCommandHooks({
            plugins: allPlugins,
            cli,
            command: def,
            parsedOptions: rawOptions,
            parsedPositionals: positionalArgs,
        });
        
        const middlewareContext = await executeMiddlewareChain(def.middleware, cli, command);
        
        const extrageousOptionsBehavior = def.throwOnExtrageousOptions ?? 'throw';
        const optionNames = buildOptionNames(cli, command);
        const validatedOptions = validateOptionsExist(
            rawOptions,
            def.options,
            extrageousOptionsBehavior,
            optionNames
        );
        
        await validateAndExecuteOptions(validatedOptions, cli, command, middlewareContext);
        
        const positionalSchema = def.positional;
        const positional = validatePositional(positionalSchema, positionalArgs);
        
        const optionsSchema = def.options;
        const cliOptions = validateOptions(
            optionsSchema,
            validatedOptions,
            extrageousOptionsBehavior,
            command.bequeathOptions
        );
        
        if (def.handler) {
            const handlerParams: CommandHandlerParams<typeof positionalSchema, typeof optionsSchema> = {
                positional,
                options: cliOptions,
                context: middlewareContext,
                command,
                cli,
            };
            await def.handler(handlerParams);
        }
    } catch (error) {
        if (error instanceof HaltError) {
            return;
        }
        throw error;
    } finally {
        await executePostCommandHooks({
            plugins: allPlugins,
            cli,
            command: def,
            commandInstance: command,
        });
    }
}
