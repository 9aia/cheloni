import type { RootCommand } from "~/core/creation/command";
import { createRootCommand } from "~/core/creation/command";
import type { Plugin } from "~/core/creation/plugin";
import { createPlugin } from "~/core/creation/plugin";
import type { CliDefinition, CliErrorHandler } from "~/core/definition/cli";
import { getCliManifest, type CliManifest, type CliManifestSource } from "~/core/manifest/cli";
import { readNearestPackageJson } from "~/core/creation/read-nearest-package-json";
import type { PluginDefinition } from "~/core/definition/plugin";
import type { RuntimeObject } from "~/utils/creation/runtime-object";
import { ManifestKeyedMap } from "~/utils/definition";
import { PluginInitError } from "~/core/execution/plugin/errors";
import { getErrorMessage } from "~/utils/execution/errors";

export interface Cli extends RuntimeObject<CliManifest> {
    /** The root command of the CLI */
    command?: RootCommand;
    /** Plugins applied to all commands */
    plugins: ManifestKeyedMap<Plugin>;
    /** Custom error handler called when no plugin handles the error. */
    onError?: CliErrorHandler;
}

async function resolveCliManifestSource(definition: CliDefinition): Promise<CliManifestSource> {
    let name = definition.name;
    let version = definition.version;
    let description = definition.description;

    if (
        definition.metaUrl &&
        (name === undefined || version === undefined || description === undefined)
    ) {
        const pkg = await readNearestPackageJson(definition.metaUrl);
        if (name === undefined) {
            name = pkg.name;
        }
        if (version === undefined) {
            version = pkg.version;
        }
        if (description === undefined) {
            description = pkg.description;
        }
    }

    if (name === undefined || name === "") {
        throw new TypeError(
            'createCli: missing CLI `name`. Set `name`, or pass `metaUrl: import.meta.url` so it can be read from the nearest package.json.',
        );
    }

    const { metaUrl: _metaUrl, ...rest } = definition;
    return { ...rest, name, version, description };
}

export async function createCli(definition: CliDefinition): Promise<Cli> {
    const manifest = getCliManifest(await resolveCliManifestSource(definition));

    const pluginMap = new ManifestKeyedMap<Plugin>();

    // Create root command from definition (if provided)
    const command = definition.command ? createRootCommand(definition.command) : undefined;

    const pluginDefinitions: PluginDefinition[] = definition.plugins ?? [];

    for (const pluginDef of pluginDefinitions) {
        const plugin = createPlugin(pluginDef);
        pluginMap.set(plugin);
    }

    const cli: Cli = {
        manifest,
        command,
        plugins: pluginMap,
        onError: definition.onError,
    };

    // Call onInit hooks for all plugins
    await executePluginInitHooks(cli, pluginMap);

    return cli;
}

async function executePluginInitHooks(
    cli: Cli,
    pluginMap: ManifestKeyedMap<Plugin>,
): Promise<void> {
    for (const plugin of pluginMap.values()) {
        if (plugin.definition.onInit) {
            try {
                await plugin.definition.onInit({ cli, plugin });
            } catch (hookError) {
                const message = getErrorMessage(hookError);
                const error = new PluginInitError(`Plugin ${plugin.manifest.name} onInit hook failed: ${message}`, hookError);

                // Plugin errors go straight to CLI onError to avoid onError-plugin loops.
                if (cli.onError) {
                    try {
                        await cli.onError({ error, cli });
                    } catch (handlerError) {
                        console.error("CLI onError handler failed:", handlerError);
                    }
                }

                throw error;
            }
        }
    }
}
