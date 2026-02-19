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
import { getAliasMap, getSchemaAliases, getSchemaDeprecated, getSchemaObject } from "~/utils/definition";
import { getPositionalManifest } from "~/core/manifest/command/positional";

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
    const globalPlugins = Array.from(cli.plugins.values());
    const commandPlugins = (commandDef.plugins ?? []).map(createPlugin);
    return [...globalPlugins, ...commandPlugins];
}

function buildAliasMap(commandDef: Command["definition"], cli: Cli, command: Command): Record<string, string[]> {
    const commandAliasMap = commandDef.options ? getAliasMap(commandDef.options) : {};
    const globalAliasMap: Record<string, string[]> = {};
    
    // Include bequeathOptions from parent commands
    for (const bequeathOpt of command.bequeathOptions.values()) {
        const aliases = getSchemaAliases(bequeathOpt.definition.schema);
        if (aliases !== undefined) {
            globalAliasMap[bequeathOpt.definition.name] = aliases;
        }
    }
    
    return { ...commandAliasMap, ...globalAliasMap };
}

async function executeMiddlewareChain(
    middleware: Command["definition"]["middleware"],
    command: Command
): Promise<Record<string, any>> {
    return await executeMiddleware({
        middlewares: middleware ?? [],
        command,
    });
}

async function validateAndExecuteGlobalOptions(
    validatedOptions: Record<string, any>,
    cli: Cli,
    command: Command,
    context: Context
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
            await bequeathOpt.definition.handler({
                value: parsedValue,
                option: {
                    name: optName,
                    schema: bequeathOpt.definition.schema,
                    handler: bequeathOpt.definition.handler,
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
    bequeathOptions: Command["bequeathOptions"],
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
    
    for (const bequeathOpt of bequeathOptions.values()) {
        if (validatedOptions[bequeathOpt.definition.name] !== undefined) {
            const bequeathOptDeprecated = getSchemaDeprecated(bequeathOpt.definition.schema);
            if (bequeathOptDeprecated) {
                const message = typeof bequeathOptDeprecated === 'string' 
                    ? bequeathOptDeprecated 
                    : 'This option is deprecated';
                console.warn(`Deprecated: --${bequeathOpt.definition.name}: ${message}`);
            }
        }
    }
}

function validateOptions<T extends z.ZodTypeAny | undefined>(
    optionsSchema: T,
    validatedOptions: Record<string, any>,
    extrageousOptionsBehavior: 'throw' | 'filter-out' | 'pass-through',
    bequeathOptions: Command["bequeathOptions"]
): InferOptionsType<T> {
    if (!optionsSchema) {
        showDeprecationWarnings(validatedOptions, null, bequeathOptions, undefined);
        return validatedOptions as InferOptionsType<T>;
    }
    
    const validOptionNames = getValidOptionNames(optionsSchema);
    const commandOptions = getSchemaObject(optionsSchema);
    
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

function buildGlobalOptionNames(cli: Cli, command: Command): Set<string> {
    // mri returns BOTH the canonical key AND the alias key(s) in the parsed output.
    // Include global option aliases here so unknown-option validation doesn't reject `-h`, `-v`, etc.
    const names = new Set<string>();
    
    // Include bequeathOptions from parent commands
    for (const opt of command.bequeathOptions.values()) {
        names.add(opt.definition.name);
        for (const a of getSchemaAliases(opt.definition.schema) ?? []) {
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
        const middlewareContext = await executeMiddlewareChain(def.middleware, command);
        
        const extrageousOptionsBehavior = def.throwOnExtrageousOptions ?? 'throw';
        const globalOptionNames = buildGlobalOptionNames(cli, command);
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
            command.bequeathOptions
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
