import { definePlugin } from "~/core/definition/plugin";
import * as _ from "lodash-es";
import configOption from "~/std/global-options/config";
import { createCommand, type Middleware } from "~/core";
import defaultRootCommand from "~/std/commands/default-root";
import type z from "zod";
import path from "node:path";
import fs from "node:fs/promises";
import { getLocalConfigPath, getGlobalConfigPath } from "~/std/utils/config";

export interface ConfigPluginConfig {
    /**
     * Default configuration object to merge with loaded config.
     * Values from files always take precedence over defaultConfig.
     * Defaults to {} if not provided.
     */
    defaultConfig?: unknown;
    /**
     * Default filename to use for local config file lookup.
     * If not specified, defaults to `<cli-name>.config.json`.
     * This only affects the local (cwd) lookup, not global or explicit paths.
     */
    defaultFilename?: string;
    /**
     * Zod schema to validate the merged configuration against.
     * Validation occurs after merging config file and defaultConfig.
     * If validation fails, an error is thrown with details about the validation failure.
     */
    schema?: z.ZodTypeAny;
}

export default definePlugin((pluginConfig: ConfigPluginConfig = {}) => ({
    name: "config",
    onInit: async ({ cli }) => {
        if (cli.command) {
            const existingDef = cli.command.definition;
            const existingBequeathOptions = existingDef.bequeathOptions ?? [];

            cli.command = createCommand({
                ...existingDef,
                bequeathOptions: [...existingBequeathOptions, configOption],
            });
            return;
        }

        cli.command = createCommand({
            ...defaultRootCommand,
            bequeathOptions: [configOption],
        });
    },
    onPreCommandExecution: async ({ cli, command }) => {
        const options = command.options ?? {};
        const explicitConfigPath = options.config;
        const cliName = cli.manifest.name;

        // Try to load config file in precedence order: explicit -> local -> global
        // If a file is invalid (parse error or validation error), warn and try next
        // Use the first valid file found (no merging between files)
        let fileConfig: unknown = undefined;
        let loadedFile: { path: string; scope: "explicit" | "local" | "global" } | undefined = undefined;

        const defaultConfig = pluginConfig.defaultConfig ?? {};

        // Helper to try reading and validating a config file
        const tryReadConfigFile = async (filePath: string, scope: "explicit" | "local" | "global"): Promise<boolean> => {
            try {
                // Try to read the file
                const raw = await fs.readFile(filePath, "utf8");
                const json = raw.trim().length === 0 ? {} : JSON.parse(raw);
                
                // Merge with defaultConfig for validation
                const mergedConfig = _.merge({}, defaultConfig, json);
                
                // Validate against schema if provided
                if (pluginConfig.schema) {
                    try {
                        pluginConfig.schema.parse(mergedConfig);
                    } catch (error) {
                        // Validation failed - warn and return false to try next file
                        const zodError = error as z.ZodError;
                        console.warn(
                            `Warning: Configuration file at ${filePath} failed validation:\n${zodError.issues.map(issue => `  - ${issue.path.join('.') || 'root'}: ${issue.message}`).join('\n')}\nFalling back to next config file in precedence order.`
                        );
                        return false;
                    }
                }
                
                // File is valid - use it
                fileConfig = json;
                loadedFile = { path: filePath, scope };
                return true;
            } catch (error: any) {
                if (error && typeof error === "object" && (error as any).code === "ENOENT") {
                    // File doesn't exist - try next
                    return false;
                }
                
                // Parse error or other error - warn and try next
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(
                    `Warning: Failed to read or parse config file at ${filePath}: ${errorMessage}\nFalling back to next config file in precedence order.`
                );
                return false;
            }
        };

        // 1. Try explicit path (if provided)
        if (explicitConfigPath) {
            const explicitPath = path.resolve(explicitConfigPath);
            await tryReadConfigFile(explicitPath, "explicit");
        }

        // 2. Try local (cwd) - use defaultFilename or <cli-name>.config.json
        if (!loadedFile) {
            const localPath = pluginConfig.defaultFilename
                ? path.resolve(process.cwd(), pluginConfig.defaultFilename)
                : getLocalConfigPath(cliName);
            await tryReadConfigFile(localPath, "local");
        }

        // 3. Try global (OS-specific)
        if (!loadedFile) {
            const globalPath = getGlobalConfigPath(cliName);
            await tryReadConfigFile(globalPath, "global");
        }

        const files: Array<{ path: string; scope: "explicit" | "local" | "global" }> = loadedFile ? [loadedFile] : [];

        // Merge with defaultConfig (defaults to {})
        // File config takes precedence over defaultConfig
        let finalConfig: unknown;
        
        if (fileConfig === undefined) {
            finalConfig = defaultConfig;
        } else {
            finalConfig = _.merge({}, defaultConfig, fileConfig);
        }

        // Final validation: if no file was loaded, validate defaultConfig
        // If a file was loaded, it was already validated in tryReadConfigFile
        if (pluginConfig.schema && !loadedFile) {
            try {
                finalConfig = pluginConfig.schema.parse(finalConfig);
            } catch (error) {
                const zodError = error as z.ZodError;
                const errorMessage = `Configuration validation failed for defaultConfig:\n${zodError.issues.map(issue => `  - ${issue.path.join('.') || 'root'}: ${issue.message}`).join('\n')}`;
                throw new Error(errorMessage);
            }
        }

        if(cli.command) {
            const middleware: Middleware = async ({ context, next }) => {
                context.config = finalConfig;
                context.configFiles = files;
                await next();
            };
            const existingMiddleware = cli.command.definition.middleware ?? [];
            cli.command.definition.middleware = [middleware, ...existingMiddleware];
        }
    },
}));
