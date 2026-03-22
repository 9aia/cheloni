import { loadConfig, type LoadConfigOptions } from "c12";
import path from "node:path";
import z from "zod";
import { createCommand } from "~/core";
import type { PluginCommandExecutionHook, PluginHook } from "~/core/creation/plugin/hook";
import type { AnyMiddleware } from "~/core/definition/command/middleware";
import type { PluginDefinition } from "~/core/definition/plugin";
import { definePlugin } from "~/core/definition/plugin";
import rootCommand from "~/std/core/commands/root";
import { configMiddleware } from "~/std/config/middleware/config";
import configOption from "~/std/config/options/config";
import { validateConfig } from "~/std/config/services/config";

export interface ConfigPluginConfig<T extends Record<string, any> = Record<string, any>> {
  c12Options?: LoadConfigOptions<T>;
  schema?: z.ZodTypeAny;
}

function configPluginFactory<T extends Record<string, any> = Record<string, any>>(
  pluginConfig: ConfigPluginConfig<T> = {},
): PluginDefinition {
  return definePlugin({
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
    onCommandExecution: async ({
      cli,
      parsedOptions,
      execute,
    }: Parameters<PluginCommandExecutionHook>[0]) => {
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
      const validatedConfig = validateConfig(config, pluginConfig.schema);

      if (cli.command) {
        const def = cli.command.definition as { middleware?: AnyMiddleware[] };
        const existing = def.middleware;
        const middleware = configMiddleware({ config: validatedConfig, configFile });
        def.middleware = [middleware, ...(existing ?? [])];
      }

      return await execute();
    },
  });
}

export default function configPlugin<T extends Record<string, any> = Record<string, any>>(
  config?: ConfigPluginConfig<T>,
): PluginDefinition {
  return configPluginFactory(config);
}
