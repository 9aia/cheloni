import { loadConfig, type LoadConfigOptions } from "c12";
import path from "node:path";
import z from "zod";
import { createCommand, type AnyMiddleware } from "~/core";
import type { PluginCommandHook, PluginHook } from "~/core/creation/plugin/hook";
import { definePlugin, type PluginDefinition } from "~/core/definition/plugin";
import rootCommand from "~/std/commands/root";
import configOption from "~/std/options/config";
import { ConfigValidationError } from "~/std/errors/config";

export interface ConfigPluginConfig<T extends Record<string, any> = Record<string, any>> {
    /** c12 options passed directly to `loadConfig`. */
    c12Options?: LoadConfigOptions<T>;
    /** Zod schema to validate the resolved config against. */
    schema?: z.ZodTypeAny;
}

const configPluginFactory = <T extends Record<string, any> = Record<string, any>>(
    pluginConfig: ConfigPluginConfig<T> = {},
) => ({
    name: "config",
    onInit: async ({ cli }: Parameters<PluginHook>[0]) => {
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
            ...rootCommand,
            bequeathOptions: [configOption],
        });
    },
    onBeforeCommandExecution: async ({ cli, parsedOptions }: Parameters<PluginCommandHook>[0]) => {
        const explicitConfigPath = parsedOptions?.config;
        const cliName = cli.manifest.name;

        const options: LoadConfigOptions<T> = {
            name: cliName,
            ...pluginConfig.c12Options,
        };

        if (explicitConfigPath) {
            const resolved = path.resolve(explicitConfigPath);
            options.cwd = path.dirname(resolved);
            options.configFile = path.basename(resolved, path.extname(resolved));
            options.rcFile = false;
            options.globalRc = false;
            options.packageJson = false;
        }

        const { config, configFile } = await loadConfig(options);
        let finalConfig: unknown = config ?? {};

        if (pluginConfig.schema) {
            try {
                finalConfig = pluginConfig.schema.parse(finalConfig);
            } catch (error) {
                const zodError = error as z.ZodError;
                const details = zodError?.issues?.map((issue) => {
                    const key = issue.path?.length ? issue.path.join(".") : "root";
                    return `  - ${key}: ${issue.message}`;
                });

                throw new ConfigValidationError(
                    `Config validation failed:\n${details?.join("\n") || zodError?.message || String(error)}`,
                );
            }
        }

        if (cli.command) {
            const middleware: AnyMiddleware = async ({ next }) => {
                return next({ ctx: { config: finalConfig, configFile } });
            };
            const existing = cli.command.definition.middleware;
            cli.command.definition.middleware = [middleware, ...(existing || [])];
        }
    },
});

export default definePlugin(configPluginFactory) as <T extends Record<string, any> = Record<string, any>>(
    config?: ConfigPluginConfig<T>,
) => PluginDefinition;
