import type z from "zod";
import type { Cli } from "~/core/creation/cli";
import type { Command, CommandHandlerParams } from "~/core/creation/command";
import type { InferOptionsType } from "~/core/creation/command/option";
import type { InferPositionalType } from "~/core/creation/command/positional";
import { createPlugin } from "~/core/creation/plugin";
import { extractPositionalValue, parseArgs } from "../parser";
import { HaltError, InvalidOptionsError, InvalidPositionalError } from "./errors";
import { executeMiddleware } from "./middleware";
import { getValidOptionNames, validateOptionsExist } from "./validate";
import { getAliasMap, getSchemaAlias, getSchemaDeprecated, getSchemaObject } from "~/utils/definition";
import { getPositionalManifest } from "~/core/manifest/command/positional";
import { normalizeMaybeArray } from "~/lib/js";

export type Context = {
    [key: string]: any;
};

export function halt(): never {
    throw new HaltError();
}
export type HaltFunction = typeof halt;

export interface ExecuteCommandOptions {
    args: string[];
    command: Command;
    cli: Cli;
}

function collectPlugins(cli: Cli, commandDef: Command["definition"]) {
    const globalPlugins = Array.from(cli.plugins);
    const commandPluginDefinitions = normalizeMaybeArray(commandDef.plugin);
    const commandPlugins = commandPluginDefinitions.map(createPlugin);
    return [...globalPlugins, ...commandPlugins];
}

function buildAliasMap(commandDef: Command["definition"], cli: Cli): Record<string, string | string[]> {
    const commandAliasMap = commandDef.options ? getAliasMap(commandDef.options) : {};
    const globalAliasMap: Record<string, string | string[]> = {};
    
    for (const globalOpt of cli.globalOptions) {
        const alias = getSchemaAlias(globalOpt.definition.schema);
        if (alias !== undefined) {
            globalAliasMap[globalOpt.definition.name] = alias;
        }
    }
    
    return { ...commandAliasMap, ...globalAliasMap };
}

async function executeMiddlewareChain(
    middlewares: Command["definition"]["middleware"],
    command: Command
): Promise<Record<string, any>> {
    return await executeMiddleware({
        middlewares: normalizeMaybeArray(middlewares),
        command,
    });
}

async function validateAndExecuteGlobalOptions(
    validatedOptions: Record<string, any>,
    cli: Cli,
    command: Command,
    context: Context
): Promise<void> {
    for (const globalOpt of cli.globalOptions) {
        const optName = globalOpt.definition.name;
        const optValue = validatedOptions[optName];
        
        if (optValue === undefined) {
            continue;
        }
        
        let parsedValue: any = optValue;
        if (globalOpt.definition.schema) {
            try {
                parsedValue = globalOpt.definition.schema.parse(optValue);
            } catch (error) {
                const zodError = error as z.ZodError;
                throw new InvalidOptionsError(
                    `Invalid value for --${optName}: ${zodError.message}`,
                    zodError.issues
                );
            }
        }
        
        if (globalOpt.definition.handler) {
            await globalOpt.definition.handler({
                value: parsedValue,
                option: {
                    name: optName,
                    schema: globalOpt.definition.schema,
                    handler: globalOpt.definition.handler,
                },
                command,
                cli,
                context,
                halt,
            });
        }
    }
}

function validatePositional<T extends z.ZodTypeAny | undefined>(
    positionalSchema: T,
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
    globalOptions: Cli["globalOptions"],
    optionsSchema: z.ZodTypeAny | undefined
): void {
    if (commandOptions) {
        for (const [optName, optSchema] of Object.entries(commandOptions)) {
            if (validatedOptions[optName] !== undefined) {
                const optDeprecated = getSchemaDeprecated(optSchema);
                if (optDeprecated) {
                    const message = typeof optDeprecated === 'string' 
                        ? optDeprecated 
                        : 'This option is deprecated';
                    console.warn(`Deprecated: --${optName}: ${message}`);
                }
            }
        }
    }
    
    for (const globalOpt of globalOptions) {
        if (validatedOptions[globalOpt.definition.name] !== undefined) {
            const globalOptDeprecated = getSchemaDeprecated(globalOpt.definition.schema);
            if (globalOptDeprecated) {
                const message = typeof globalOptDeprecated === 'string' 
                    ? globalOptDeprecated 
                    : 'This option is deprecated';
                console.warn(`Deprecated: --${globalOpt.definition.name}: ${message}`);
            }
        }
    }
}

function validateOptions<T extends z.ZodTypeAny | undefined>(
    optionsSchema: T,
    validatedOptions: Record<string, any>,
    extrageousOptionsBehavior: 'throw' | 'filter-out' | 'pass-through',
    globalOptions: Cli["globalOptions"]
): InferOptionsType<T> {
    if (!optionsSchema) {
        showDeprecationWarnings(validatedOptions, null, globalOptions, undefined);
        return validatedOptions as InferOptionsType<T>;
    }
    
    const validOptionNames = getValidOptionNames(optionsSchema);
    const commandOptions = getSchemaObject(optionsSchema);
    
    showDeprecationWarnings(validatedOptions, commandOptions, globalOptions, optionsSchema);
    
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

async function executePreCommandHooks(
    allPlugins: ReturnType<typeof collectPlugins>,
    cli: Cli,
    commandDef: Command["definition"]
): Promise<void> {
    for (const plugin of allPlugins) {
        if (plugin.definition.onPreCommandExecution) {
            try {
                await plugin.definition.onPreCommandExecution({ cli, plugin, command: commandDef });
            } catch (error) {
                console.error(`Plugin ${plugin.manifest.name} onPreCommandExecution hook failed:`, error);
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error(`Plugin ${plugin.manifest.name} onPreCommandExecution hook failed: ${error}`);
            }
        }
    }
}

async function executePostCommandHooks(
    allPlugins: ReturnType<typeof collectPlugins>,
    cli: Cli,
    commandDef: Command["definition"]
): Promise<void> {
    for (const plugin of allPlugins) {
        if (plugin.definition.onAfterCommandExecution) {
            try {
                await plugin.definition.onAfterCommandExecution({ cli, plugin, command: commandDef });
            } catch (hookError) {
                console.error(`Plugin ${plugin.manifest.name} onAfterCommandExecution hook failed:`, hookError);
            }
        }
    }
}

export async function executeCommand(options: ExecuteCommandOptions): Promise<void> {
    const { command, args, cli } = options;
    const def = command.definition;
    
    const allPlugins = collectPlugins(cli, def);
    const aliasMap = buildAliasMap(def, cli);
    const { positional: positionalArgs, options: rawOptions } = parseArgs(args, aliasMap);
    
    try {
        const middlewareContext = await executeMiddlewareChain(def.middleware, command);
        
        const extrageousOptionsBehavior = def.throwOnExtrageousOptions ?? 'throw';
        const globalOptionNames = new Set(Array.from(cli.globalOptions).map(opt => opt.definition.name));
        const validatedOptions = validateOptionsExist(
            rawOptions,
            def.options,
            extrageousOptionsBehavior,
            globalOptionNames
        );
        
        await validateAndExecuteGlobalOptions(validatedOptions, cli, command, middlewareContext);
        
        const positionalSchema = def.positional;
        const positional = validatePositional(positionalSchema, positionalArgs);
        
        const optionsSchema = def.options;
        const cliOptions = validateOptions(
            optionsSchema,
            validatedOptions,
            extrageousOptionsBehavior,
            cli.globalOptions
        );
        
        await executePreCommandHooks(allPlugins, cli, def);
        
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
