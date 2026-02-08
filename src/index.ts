import mri from "mri";
import z from "zod";
import type { Command, ExtrageousOptionsBehavior, InferOptionsType, InferPositionalType, Manifest } from "./types";
export { type ExtrageousOptionsBehavior, type Command, type InferPositionalType, type InferOptionsType, type Manifest } from "./types";

// #region Core

export function defineCommand<
    TPositional extends z.ZodTypeAny | undefined,
    TOptions extends z.ZodTypeAny | undefined
>(definition: Command<TPositional, TOptions>): Command<TPositional, TOptions> {
    return definition;
}

// #endregion

// #region Runtime

export interface RunOptions {
    argv?: string[];
    manifest: Manifest;
}

function parseArgs(argv: string[], aliasMap: Record<string, string | string[]> = {}) {
    // Parse with mri - it separates positional args from options
    const parsed = mri(argv, {
        boolean: [],
        string: [],
        alias: aliasMap,
        default: {},
    });

    const positional = parsed._ || [];
    const { _, ...options } = parsed;

    return { positional, options };
}

function extractPositionalValue(
    positionalSchema: z.ZodTypeAny | undefined,
    positionalArgs: string[],
    index: number
): any {
    if (!positionalSchema) {
        return undefined;
    }

    if (index < positionalArgs.length) {
        return positionalArgs[index];
    }

    return undefined;
}

function getOptionsShape(optionsSchema: z.ZodTypeAny | undefined): Record<string, z.ZodTypeAny> | undefined {
    if (!optionsSchema) {
        return undefined;
    }
    
    // Check if it's a ZodObject by looking for shape property
    try {
        const schema = optionsSchema as any;
        const def = schema._def;
        
        // Try multiple ways to access shape
        // Method 1: Direct shape property
        if (def?.shape) {
            if (typeof def.shape === 'object' && !Array.isArray(def.shape) && def.shape.constructor === Object) {
                return def.shape;
            }
            if (typeof def.shape === 'function') {
                const shape = def.shape();
                if (shape && typeof shape === 'object') {
                    return shape;
                }
            }
        }
        
        // Method 2: Check typeName and shape
        if (def?.typeName === 'ZodObject') {
            if (def.shape) {
                if (typeof def.shape === 'object' && !Array.isArray(def.shape)) {
                    return def.shape;
                }
                if (typeof def.shape === 'function') {
                    return def.shape();
                }
            }
        }
        
        // Method 3: Try accessing via schema directly (some Zod versions)
        if (schema.shape && typeof schema.shape === 'object') {
            return schema.shape;
        }
    } catch {
        // Not a ZodObject or shape not accessible
    }
    
    return undefined;
}

function getValidOptionNames(definedOptions: z.ZodTypeAny | undefined): Set<string> {
    const validOptionNames = new Set<string>();
    
    const shape = getOptionsShape(definedOptions);
    if (!shape) {
        return validOptionNames;
    }
    
    for (const [optionName, schema] of Object.entries(shape)) {
        validOptionNames.add(optionName);
        
        // Add aliases to the valid set
        const alias = getSchemaAlias(schema);
        if (alias) {
            const aliases = Array.isArray(alias) ? alias : [alias];
            for (const aliasName of aliases) {
                validOptionNames.add(aliasName);
            }
        }
    }
    
    return validOptionNames;
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class InvalidOptionsError extends ValidationError {
    constructor(message: string) {
        super(message);
    }
}

export class InvalidPositionalError extends ValidationError {
    constructor(message: string) {
        super(message);
    }
}

function validateOptionsExist(
    rawOptions: Record<string, any>,
    definedOptions: z.ZodTypeAny | undefined,
    behavior: ExtrageousOptionsBehavior = 'throw'
): Record<string, any> {
    const shape = getOptionsShape(definedOptions);
    
    if (!shape) {
        // If no options are defined, any provided options are invalid
        const providedOptions = Object.keys(rawOptions);
        if (providedOptions.length > 0) {
            if (behavior === 'throw') {
                throw new InvalidOptionsError(
                    `Unknown options provided: ${providedOptions.map(opt => `--${opt}`).join(', ')}. This command does not accept any options.`
                );
            }
            // For 'filter-out', return empty object (discard extras)
            // For 'pass-through', return raw options as-is
            return behavior === 'pass-through' ? rawOptions : {};
        }
        return {};
    }

    // Build a set of all valid option names (including aliases)
    const validOptionNames = getValidOptionNames(definedOptions);
    const providedOptionNames = Object.keys(rawOptions);
    const unknownOptions = providedOptionNames.filter(opt => !validOptionNames.has(opt));

    if (unknownOptions.length > 0) {
        if (behavior === 'throw') {
            // Build list of available options with their aliases
            const knownOptions = Object.entries(shape).map(([name, schema]) => {
                const alias = getSchemaAlias(schema);
                if (alias) {
                    const aliases = Array.isArray(alias) ? alias : [alias];
                    const aliasStr = aliases.map(a => `-${a}`).join(', ');
                    return `--${name} (${aliasStr})`;
                }
                return `--${name}`;
            });
            
            throw new InvalidOptionsError(
                `Unknown options provided: ${unknownOptions.map(opt => `--${opt}`).join(', ')}.\n` +
                (knownOptions.length > 0 
                    ? `Available options: ${knownOptions.join(', ')}`
                    : 'This command does not accept any options.')
            );
        }
        
        if (behavior === 'filter-out') {
            // Silently remove unknown options, return only valid ones
            const filteredOptions: Record<string, any> = {};
            for (const [key, value] of Object.entries(rawOptions)) {
                if (validOptionNames.has(key)) {
                    filteredOptions[key] = value;
                }
            }
            return filteredOptions;
        }
        
        // behavior === 'pass-through': return all options (including unknown ones)
        // The handler will receive them, and they won't be validated by Zod
        return rawOptions;
    }

    return rawOptions;
}

async function executeCommand<
    TPositional extends z.ZodTypeAny | undefined,
    TOptions extends z.ZodTypeAny | undefined
>(command: Command<TPositional, TOptions>, argv: string[]) {
    const definition = command;
    
    // Build alias map from option definitions
    const aliasMap = buildAliasMap(definition.options);
    
    const { positional: positionalArgs, options: rawOptions } = parseArgs(argv, aliasMap);

    // Run middleware if any
    if (definition.middleware) {
        for (const middleware of definition.middleware) {
            middleware();
        }
    }

    // Validate that provided options exist in the definition
    // Default to 'throw' if not specified (fail-safe default)
    const extrageousOptionsBehavior = definition.throwOnExtrageousOptions ?? 'throw';
    const validatedOptions = validateOptionsExist(rawOptions, definition.options, extrageousOptionsBehavior);

    // Extract and validate positional argument
    let positional: InferPositionalType<TPositional>;
    if (definition.positional) {
        const positionalValue = extractPositionalValue(definition.positional, positionalArgs, 0);
        try {
            positional = definition.positional.parse(positionalValue) as InferPositionalType<TPositional>;
        } catch (error) {
            throw new InvalidPositionalError((error as z.ZodError).message);
        }
    } else {
        positional = undefined as InferPositionalType<TPositional>;
    }

    // Validate options with Zod
    // When throwOnExtrageousOptions is false, validatedOptions may contain extra options
    // Zod will only validate the defined options and ignore the rest
    let options: InferOptionsType<TOptions>;
    if (definition.options) {
        // Extract only the defined options for Zod validation
        // This ensures Zod only validates what's in the schema
        const shape = getOptionsShape(definition.options);
        let optionsForZod: Record<string, any> = {};
        
        if (shape) {
            // Only include options that are in the schema
            for (const key of Object.keys(shape)) {
                if (key in validatedOptions) {
                    optionsForZod[key] = validatedOptions[key];
                }
            }
        } else {
            // If not a ZodObject, pass all options (Zod will handle validation)
            optionsForZod = { ...validatedOptions };
        }
        
        const parsed = definition.options.parse(optionsForZod) as InferOptionsType<TOptions>;
        
        // If behavior is 'pass-through', merge in the extra options
        if (extrageousOptionsBehavior === 'pass-through') {
            const extraOptions: Record<string, any> = {};
            const validOptionNames = getValidOptionNames(definition.options);
            for (const [key, value] of Object.entries(validatedOptions)) {
                if (!validOptionNames.has(key)) {
                    extraOptions[key] = value;
                }
            }
            // Merge parsed options with extra options
            options = Object.assign({}, parsed, extraOptions) as InferOptionsType<TOptions>;
        } else {
            // For 'throw' and 'filter-out', only use parsed options
            options = parsed;
        }
    } else {
        // No options schema defined, return all options as-is
        options = validatedOptions as InferOptionsType<TOptions>;
    }

    // Execute handler
    await definition.handler({ positional, options });
}

function getSchemaDescription(schema: z.ZodTypeAny | undefined): string | undefined {
    if (!schema) return undefined;
    
    // Try to access description from Zod's internal structure
    // Zod stores metadata in _def, but the exact structure varies
    try {
        const def = (schema as any)._def;
        if (def?.description) {
            return def.description;
        }
        // Some Zod versions store it differently
        if (def?.metadata?.description) {
            return def.metadata.description;
        }
    } catch {
        // Ignore errors when accessing internal structure
    }
    
    return undefined;
}

function getSchemaAlias(schema: z.ZodTypeAny | undefined): string | string[] | undefined {
    if (!schema) return undefined;
    
    // Try to access alias from Zod's internal structure
    try {
        const def = (schema as any)._def;
        if (def?.alias !== undefined) {
            return def.alias;
        }
        // Some Zod versions store it differently
        if (def?.metadata?.alias !== undefined) {
            return def.metadata.alias;
        }
    } catch {
        // Ignore errors when accessing internal structure
    }
    
    return undefined;
}

function buildAliasMap(optionsSchema: z.ZodTypeAny | undefined): Record<string, string | string[]> {
    const shape = getOptionsShape(optionsSchema);
    if (!shape) return {};
    
    const aliasMap: Record<string, string | string[]> = {};
    
    for (const [optionName, schema] of Object.entries(shape)) {
        const alias = getSchemaAlias(schema);
        if (alias !== undefined) {
            aliasMap[optionName] = alias;
        }
    }
    
    return aliasMap;
}

function findCommandByPath(manifest: Manifest, path: string): { command: Command; key: string } | null {
    // Build a map of paths to commands
    const pathMap = new Map<string, { command: Command; key: string }>();
    
    for (const [key, command] of Object.entries(manifest)) {
        if (command.paths) {
            for (const commandPath of command.paths) {
                pathMap.set(commandPath, { command, key });
            }
        }
    }
    
    return pathMap.get(path) || null;
}

export async function run({ argv: _argv, manifest }: RunOptions) {
    const argv = _argv || process.argv.slice(2);

    const commandKeys = Object.keys(manifest);
    
    if (commandKeys.length === 0) {
        console.error("No commands registered in manifest");
        process.exit(1);
    }

    if (argv.length === 0) {
        console.error("No command specified");
        process.exit(1);
    }

    // Check if first argument is a command path (not an option)
    const firstArg = argv[0];
    const isCommandPath = firstArg && !firstArg.startsWith('-');
    
    let command: Command | null = null;
    let remainingArgv = argv;
    
    if (isCommandPath) {
        // Try to find command by path
        const found = findCommandByPath(manifest, firstArg);
        if (found) {
            command = found.command;
            remainingArgv = argv.slice(1); // Remove command path from argv
        }
    }
    
    // If no command found by path, use default (first command without paths or first command)
    if (!command) {
        // Try to find a command without paths (default command)
        let defaultCommand: Command | null = null;
        let defaultKey: string | null = null;
        
        for (const [key, cmd] of Object.entries(manifest)) {
            if (!cmd.paths || cmd.paths.length === 0) {
                defaultCommand = cmd;
                defaultKey = key;
                break;
            }
        }
        
        // If no default command found, use first command
        if (!defaultCommand) {
            const firstCommandKey = commandKeys[0];
            if (!firstCommandKey) {
                console.error("No command keys found");
                process.exit(1);
            }
            const firstCommand = manifest[firstCommandKey];
            if (!firstCommand) {
                console.error(`Command "${firstCommandKey}" not found in manifest`);
                process.exit(1);
            }
            defaultCommand = firstCommand;
            defaultKey = firstCommandKey;
        }
        
        command = defaultCommand;
        
        // If a path was provided but not found, show error
        if (isCommandPath) {
            console.error(`Unknown command: ${firstArg}`);
            console.error(`Available commands: ${commandKeys.join(', ')}`);
            process.exit(1);
        }
    }

    if (!command) {
        console.error("No command found");
        process.exit(1);
    }

    try {
        await executeCommand(command, remainingArgv);
    } catch (error) {
        handleError(error, command);
        process.exit(1);
    }
}

function handleError(error: unknown, command: Command) {
    if (error instanceof z.ZodError) {
        handleValidationError(error, command);
    } else if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error("An unknown error occurred");
    }
}

function handleValidationError(error: z.ZodError, command: Command) {
    console.error("Validation error:");
    for (const err of error.issues) {
        let fieldName: string;
        
        if (err.path.length === 0) {
            // Empty path means it's a positional argument
            const positionalSchema = command.positional;
            const description = getSchemaDescription(positionalSchema);
            if (description) {
                fieldName = `positional argument: ${description}`;
            } else {
                fieldName = "positional argument";
            }
        } else {
            // Non-empty path means it's an option
            const optionName = err.path.join(".");
            const optionSchema = command.options?.[optionName];
            const description = getSchemaDescription(optionSchema);
            if (description) {
                fieldName = `option --${optionName}: ${description}`;
            } else {
                fieldName = `option --${optionName}`;
            }
        }
        
        console.error(`  ${fieldName}: ${err.message}`);
    }
}
