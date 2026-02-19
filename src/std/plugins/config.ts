import { definePlugin } from "~/core/definition/plugin";
import { resolveConfig } from "~/std/services/config";
import * as _ from "lodash-es";
import configOption from "~/std/global-options/config";
import { createCommand, type Middleware } from "~/core";
import defaultRootCommand from "~/std/commands/default-root";

export interface ConfigPluginConfig {
    /**
     * Default configuration object to merge with loaded config.
     * Values from files and explicit paths always take precedence.
     */
    defaultConfig?: unknown;
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
        const configPath = options.config;

        const { config, files } = await resolveConfig(cli, configPath);

        let finalConfig: unknown;

        if (pluginConfig.defaultConfig !== undefined) {
            if (config === undefined) {
                finalConfig = pluginConfig.defaultConfig;
            } else {
                finalConfig = _.merge(config, pluginConfig.defaultConfig);
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
