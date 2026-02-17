import type { Cli } from "~/core/creation/cli";
import type { CommandDefinition } from "~/core/definition/command";
import type { Plugin } from "~/core/creation/plugin";
import type { MaybePromise } from "~/lib/ts-utils";

export interface PluginHookContext {
    cli: Cli;
    plugin: Plugin;
}
export interface PluginCommandHookContext extends PluginHookContext {
    command: CommandDefinition;
}

export type PluginHook = (context: PluginHookContext) => MaybePromise<void>;
export type PluginCommandHook = (context: PluginCommandHookContext) => MaybePromise<void>;
