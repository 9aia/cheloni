import type z from "zod";
import type { Cli } from "~/core/creation/cli";
import type { Command, CommandHandlerContext } from "~/core/creation/command";
import type { InferOptionsType } from "~/core/creation/command/option";
import type { InferPositionalType } from "~/core/creation/command/positional";
import { createPlugin } from "~/core/creation/plugin";
import { extractPositionalValue, parseArgs } from "../parser";
import { InvalidPositionalError } from "./errors";
import { executeMiddleware } from "./middleware";
import { getValidOptionNames, validateOptionsExist } from "./validate";
import { getAliasMap, getSchemaAlias, getSchemaDeprecated, getSchemaObject } from "~/lib/zod";
import { getPositionalManifest } from "~/core/manifest/command/positional";
import { normalizeMaybeArray } from "~/lib/js";

export interface ExecuteCommandOptions {
    args: string[];
    command: Command;
    cli: Cli;
}

export async function executeCommand(options: ExecuteCommandOptions): Promise<void> {
    const { command, args, cli } = options;
    const def = command.definition;
    
    // Build alias map from option definitions (command + global options)
    const commandAliasMap = def.options ? getAliasMap(def.options) : {};
    const globalAliasMap: Record<string, string | string[]> = {};
    for (const globalOpt of cli.globalOptions) {
        const alias = getSchemaAlias(globalOpt.definition.schema);
        if (alias !== undefined) {
            globalAliasMap[globalOpt.definition.name] = alias;
        }
    }
    const aliasMap = { ...commandAliasMap, ...globalAliasMap };
    
    // Parse arguments
    const { positional: positionalArgs, options: rawOptions } = parseArgs(args, aliasMap);

    // Execute middleware
    const middlewareArray = def.middleware 
        ? (Array.isArray(def.middleware) ? def.middleware : [def.middleware])
        : [];
    const middlewareData = await executeMiddleware({
        middlewares: middlewareArray,
        command,
    });

    // Validate extrageous options behavior
    const extrageousOptionsBehavior = def.throwOnExtrageousOptions ?? 'throw';
    
    // Get global option names (these are always valid)
    const globalOptionNames = new Set(Array.from(cli.globalOptions).map(opt => opt.definition.name));
    
    // Validate options exist (global options are always considered valid)
    const validatedOptions = validateOptionsExist(
        rawOptions, 
        def.options, 
        extrageousOptionsBehavior,
        globalOptionNames
    );

    // Extract and validate positional argument
    let positional: InferPositionalType<typeof def.positional>;
    if (def.positional) {
        const positionalValue = extractPositionalValue(def.positional, positionalArgs, 0);
        
        // Show deprecation warning if positional is deprecated and is being used
        if (positionalValue !== undefined) {
            const posDeprecated = getPositionalManifest(def.positional)?.deprecated;
            if (posDeprecated) {
                const message = typeof posDeprecated === 'string' 
                    ? posDeprecated 
                    : 'This positional argument is deprecated';
                console.warn(`Deprecated: ${message}`);
            }
        }
        
        try {
            positional = def.positional.parse(positionalValue) as InferPositionalType<typeof def.positional>;
        } catch (error) {
            const zodError = error as z.ZodError;
            throw new InvalidPositionalError(zodError.message, zodError.issues);
        }
    } else {
        positional = undefined as InferPositionalType<typeof def.positional>;
    }

    // Validate options with Zod
    let options_: InferOptionsType<typeof def.options>;
    if (def.options) {
        const validOptionNames = getValidOptionNames(def.options);
        const commandOptions = getSchemaObject(def.options);
        
        // Show deprecation warnings for deprecated options that are being used
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
        
        // Also check global options for deprecation
        for (const globalOpt of cli.globalOptions) {
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
        
        // Build options for Zod validation (only valid options)
        const optionsForZod: Record<string, any> = {};
        const extraOptions: Record<string, any> = {};
        
        for (const [key, value] of Object.entries(validatedOptions)) {
            if (validOptionNames.has(key)) {
                optionsForZod[key] = value;
            } else if (extrageousOptionsBehavior === 'pass-through') {
                extraOptions[key] = value;
            }
        }
        
        const parsed = def.options.parse(optionsForZod) as InferOptionsType<typeof def.options>;
        
        // If behavior is 'pass-through', merge in the extra options
        if (extrageousOptionsBehavior === 'pass-through') {
            options_ = Object.assign({}, parsed, extraOptions) as InferOptionsType<typeof def.options>;
        } else {
            // For 'throw' and 'filter-out', only use parsed options
            options_ = parsed;
        }
    } else {
        // No options schema defined, but still check global options for deprecation
        for (const globalOpt of cli.globalOptions) {
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
        
        // No options schema defined, return all options as-is
        options_ = validatedOptions as InferOptionsType<typeof def.options>;
    }

    // Execute global option handlers (before command handler)
    for (const globalOpt of cli.globalOptions) {
        const optName = globalOpt.definition.name;
        const optValue = validatedOptions[optName];
        
        // Check if option is present (including via aliases)
        if (optValue !== undefined) {
            // Validate the option value if needed
            let parsedValue: any = optValue;
            if (globalOpt.definition.validate !== false) {
                try {
                    parsedValue = globalOpt.definition.schema.parse(optValue);
                } catch (error) {
                    // If validation fails, use the raw value (some options like help/version are boolean)
                    parsedValue = optValue;
                }
            }
            
            // Execute the handler
            await globalOpt.definition.handler({
                value: parsedValue,
                option: {
                    name: optName,
                    schema: globalOpt.definition.schema,
                    handler: globalOpt.definition.handler,
                },
                command,
                cli,
            });
            
            // Global options that have handlers typically exit early (like help/version)
            // So we return after executing them
            return;
        }
    }

    // Collect global and command plugins
    const globalPlugins = Array.from(cli.plugins);
    const commandPluginDefinitions = normalizeMaybeArray(def.plugin);
    const commandPlugins = commandPluginDefinitions.map(createPlugin);
    const allPlugins = [...globalPlugins, ...commandPlugins];

    // Call onBeforeCommand hooks
    for (const plugin of allPlugins) {
        if (plugin.definition.onBeforeCommand) {
            await plugin.definition.onBeforeCommand({ cli, plugin, command: def });
        }
    }

    // Create handler context
    const handlerContext: CommandHandlerContext<typeof def.positional, typeof def.options> = {
        positional,
        options: options_,
        data: middlewareData,
        command,
        cli,
    };

    // Execute handler with error handling to ensure onAfterCommand is called
    try {
        if (def.handler) {
            await def.handler(handlerContext);
        }
    } finally {
        // Call onAfterCommand hooks (even if handler failed)
        for (const plugin of allPlugins) {
            if (plugin.definition.onAfterCommand) {
                try {
                    await plugin.definition.onAfterCommand({ cli, plugin, command: def });
                } catch (hookError) {
                    // Log hook errors but don't throw - the original error should be preserved
                    console.error(`Plugin ${plugin.manifest.name} onAfterCommand hook failed:`, hookError);
                }
            }
        }
    }
}
