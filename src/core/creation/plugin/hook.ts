import type { Cli } from "~/core/creation/cli";
import type { CommandDefinition } from "~/core/definition/command";
import type { Plugin } from "~/core/creation/plugin";
import type { MaybePromise } from "~/lib/ts-utils";

export interface PluginHookParams {
    cli: Cli;
    plugin: Plugin;
}
export interface PluginCommandHookParams extends PluginHookParams {
    command: CommandDefinition;
}

export type PluginHook = (params: PluginHookParams) => MaybePromise<void>;
export type PluginCommandHook = (params: PluginCommandHookParams) => MaybePromise<void>;
