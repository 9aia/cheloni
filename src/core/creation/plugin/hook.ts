import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { CommandDefinition } from "~/core/definition/command";
import type { Plugin } from "~/core/creation/plugin";
import type { Promisable } from "type-fest";

export interface PluginHookParams {
    cli: Cli;
    plugin: Plugin;
}
export interface PluginCommandHookParams extends PluginHookParams {
    command: CommandDefinition;
    parsedOptions?: Record<string, any>;
    parsedPositionals?: string[];
}

export interface PluginErrorHookParams extends PluginHookParams {
    error: unknown;
    command?: Command;
}

export type PluginHook = (params: PluginHookParams) => Promisable<void>;
export type PluginCommandHook = (params: PluginCommandHookParams) => Promisable<void>;
/** Return `true` to indicate the error was handled and stop further propagation. */
export type PluginErrorHook = (params: PluginErrorHookParams) => Promisable<boolean | void>;
