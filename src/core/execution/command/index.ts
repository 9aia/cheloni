import type { UnknownRecord } from "type-fest";
import z from "zod";
import type { Cli } from "~/core/creation/cli";
import type { Command, CommandHandlerParams } from "~/core/creation/command";
import type { AnyMiddleware } from "~/core/creation/command/middleware";
import { createOption, type InferOptionsType } from "~/core/creation/command/option";
import type { InferPositionalType, PositionalSchema } from "~/core/creation/command/positional";
import { createPlugin } from "~/core/creation/plugin";
import type { CommandDefinition } from "~/core/definition/command";
import type { OptionsSchema } from "~/core/definition/command/option";
import { PluginAfterCommandExecutionError, PluginBeforeCommandExecutionError } from "~/core/execution/plugin/errors";
import { getOptionManifest } from "~/core/manifest/command/option";
import { getPositionalManifest } from "~/core/manifest/command/positional";
import { getAliasMap } from "~/utils/definition";
import { getErrorMessage } from "~/utils/errors";
import { extractPositionalValue, parseArgs } from "../parser";
import { HaltError, InvalidOptionsError, InvalidPositionalError } from "./errors";
import { halt } from "./halt";
import { executeMiddleware } from "./middleware";
import { getValidOptionNames, validateOptionsExist } from "./validate";

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

function buildAliasMap(commandDef: Command["definition"], cli: Cli, command: Command): Record<string, string[]> {
    const commandAliasMap = commandDef.options ? getAliasMap(commandDef.options) : {};
    const globalAliasMap: Record<string, string[]> = {};
    
    // Include bequeathOptions from parent commands
    for (const bequeathOpt of command.bequeathOptions.values()) {
        const manifest = getOptionManifest(bequeathOpt.definition.name, bequeathOpt.definition.schema);
        globalAliasMap[bequeathOpt.definition.name] = manifest.aliases;
    }
    
    return { ...commandAliasMap, ...globalAliasMap };
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

function validatePositional<T extends PositionalSchema>(
    positionalSchema: T | undefined,
    positionalArgs: string[]
): InferPositionalType<T> {
    if (!positionalSchema) {
        return undefined as InferPositionalType<T>;
    }
    
    const positionalValue = extractPositionalValue(positionalSchema, positionalArgs, 0);
    
    if (positionalValue !== undefined) {
        const posDeprecated = getPositionalManifest(positionalSchema)?.deprecated;
        if (posDeprecated) {
            const message = typeof posDeprecated === 'string' 
                ? posDeprecated 
                : 'This positional argument is deprecated';
            console.warn(`Deprecated: ${message}`);
        }
    }
    
    try {
        return positionalSchema.parse(positionalValue) as InferPositionalType<T>;
    } catch (error) {
        const zodError = error as z.ZodError;
        throw new InvalidPositionalError(zodError.message, zodError.issues);
    }
}

function showDeprecationWarnings(
    validatedOptions: Record<string, any>,
    commandOptions: Record<string, z.ZodTypeAny> | null | undefined,
    bequeathOptions: Command["bequeathOptions"],
    optionsSchema: OptionsSchema | undefined
): void {
    if (commandOptions) {
        for (const [optName, optSchema] of Object.entries(commandOptions)) {
            if (validatedOptions[optName] !== undefined) {
                const manifest = getOptionManifest(optName, optSchema);
                const optDeprecated = manifest.deprecated;
                if (optDeprecated) {
                    const message = typeof optDeprecated === 'string' 
                        ? optDeprecated 
                        : 'This option is deprecated';
                    console.warn(`Deprecated: --${optName}: ${message}`);
                }
            }
        }
    }
    
    for (const bequeathOpt of bequeathOptions.values()) {
        if (validatedOptions[bequeathOpt.definition.name] !== undefined) {
            const manifest = getOptionManifest(bequeathOpt.definition.name, bequeathOpt.definition.schema);
            const bequeathOptDeprecated = manifest.deprecated;
            if (bequeathOptDeprecated) {
                const message = typeof bequeathOptDeprecated === 'string' 
                    ? bequeathOptDeprecated 
                    : 'This option is deprecated';
                console.warn(`Deprecated: --${bequeathOpt.definition.name}: ${message}`);
            }
        }
    }
}

function validateOptions<T extends OptionsSchema>(
    optionsSchema: T | undefined,
    validatedOptions: Record<string, any>,
    extrageousOptionsBehavior: 'throw' | 'filter-out' | 'pass-through',
    bequeathOptions: Command["bequeathOptions"]
): InferOptionsType<T> {
    if (!optionsSchema) {
        showDeprecationWarnings(validatedOptions, null, bequeathOptions, undefined);
        return validatedOptions as InferOptionsType<T>;
    }
    
    const validOptionNames = getValidOptionNames(optionsSchema);
    const commandOptions = optionsSchema.shape;
    
    showDeprecationWarnings(validatedOptions, commandOptions, bequeathOptions, optionsSchema);
    
    const optionsForZod: Record<string, any> = {};
    const extraOptions: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(validatedOptions)) {
        if (validOptionNames.has(key)) {
            optionsForZod[key] = value;
        } else if (extrageousOptionsBehavior === 'pass-through') {
            extraOptions[key] = value;
        }
    }
    
    const parsed = optionsSchema.parse(optionsForZod) as InferOptionsType<T>;
    
    if (extrageousOptionsBehavior === 'pass-through') {
        return Object.assign({}, parsed, extraOptions) as InferOptionsType<T>;
    }
    
    return parsed;
}

async function executeBeforeCommandHooks(
    allPlugins: ReturnType<typeof collectPlugins>,
    cli: Cli,
    commandDefinition: CommandDefinition,
    parsedOptions?: Record<string, any>
): Promise<void> {
    for (const plugin of allPlugins) {
        if (plugin.definition.onBeforeCommandExecution) {
            try {
                await plugin.definition.onBeforeCommandExecution({ cli, plugin, command: commandDefinition, parsedOptions });
            } catch (hookError) {
                const message = getErrorMessage(hookError);
                throw new PluginBeforeCommandExecutionError(
                    `Plugin ${plugin.manifest.name} onBeforeCommandExecution hook failed: ${message}`,
                    hookError
                );
            }
        }
    }
}

async function executePostCommandHooks(
    allPlugins: ReturnType<typeof collectPlugins>,
    cli: Cli,
    commandDefinition: CommandDefinition
): Promise<void> {
    for (const plugin of allPlugins) {
        if (plugin.definition.onAfterCommandExecution) {
            try {
                await plugin.definition.onAfterCommandExecution({ cli, plugin, command: commandDefinition });
            } catch (hookError) {
                const message = getErrorMessage(hookError);
                // Log hook errors but don't throw (post hooks are best-effort)
                const error = new PluginAfterCommandExecutionError(
                    `Plugin ${plugin.manifest.name} onAfterCommandExecution hook failed: ${message}`,
                    hookError
                );
                console.error(error);
            }
        }
    }
}

function buildOptionNames(cli: Cli, command: Command): Set<string> {
    // mri returns BOTH the canonical key AND the alias key(s) in the parsed output.
    // Include global option aliases here so unknown-option validation doesn't reject `-h`, `-v`, etc.
    const names = new Set<string>();
    
    // Include bequeathOptions from parent commands
    for (const opt of command.bequeathOptions.values()) {
        names.add(opt.definition.name);
        const aliases = opt.manifest.aliases;
        for (const a of aliases) {
            if (a) names.add(a);
        }
    }

    return names;
}

export async function executeCommand(options: ExecuteCommandOptions): Promise<void> {
    const { command, args, cli } = options;
    const def = command.definition;
    
    const allPlugins = collectPlugins(cli, def);
    const aliasMap = buildAliasMap(def, cli, command);
    const { positional: positionalArgs, options: rawOptions } = parseArgs(args, aliasMap);
    
    try {
        await executeBeforeCommandHooks(allPlugins, cli, def, rawOptions);
        
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
        await executePostCommandHooks(allPlugins, cli, def);
    }
}
