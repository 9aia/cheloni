import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { RootCommandDefinition } from "~/core/definition/command";
import type { PluginpackDefinition } from "~/core/definition/pack";
import type { PluginDefinition } from "~/core/definition/plugin";
import type { Promisable } from "type-fest";

export type CliErrorHandlerParams = { error: unknown; cli: Cli; command?: Command };
export type CliErrorHandler = (params: CliErrorHandlerParams) => Promisable<void>;

export interface CliDefinition {
    name: string;
    version?: string;
    description?: string;
    details?: string;
    deprecated?: boolean | string;
    command?: RootCommandDefinition;
    plugins?: PluginDefinition[];
    pluginpacks?: PluginpackDefinition[];
    /**
     * Custom error handler invoked as a final fallback.
     *
     * - Called when no `plugin.definition.onError` hook handled the error.
     * - Also called for **plugin hook failures** (e.g. `onInit`, `onBeforeCommandExecution`, `onError` throwing),
     *   bypassing error-handler plugins to avoid infinite loops.
     */
    onError?: CliErrorHandler;
}

export function defineCli(definition: CliDefinition): CliDefinition {
    return definition;
}
