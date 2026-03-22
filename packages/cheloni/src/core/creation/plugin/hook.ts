import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { CommandDefinition } from "~/core/definition/command";
import type { Plugin } from "~/core/creation/plugin";
import type { HaltFunction } from "~/core/execution/command/halt";
import type { Promisable, UnknownRecord } from "type-fest";

export interface PluginHookParams {
  cli: Cli;
  plugin: Plugin;
}

/** Shared fields for command-scoped plugin hooks (parsed argv is only meaningful before validation). */
export interface PluginCommandHookParams extends PluginHookParams {
  command: CommandDefinition;
  parsedOptions?: Record<string, any>;
  parsedPositionals?: string[];
}

/**
 * Continue with the next `onBeforeCommandExecution` hooks, then middleware, validation, and the handler.
 * Pass `ctx` to deep-merge into command context (same merge rules as middleware `next({ ctx })`).
 */
export type PluginBeforeExecuteFn = (opts?: { ctx?: UnknownRecord }) => Promisable<void>;

export interface PluginBeforeCommandHookParams extends PluginCommandHookParams {
  execute: PluginBeforeExecuteFn;
  /** Stop the command pipeline without error (same as command middleware `halt`). */
  halt: HaltFunction;
}

/**
 * `onAfterCommandExecution` — `ctx` is the context snapshot after the command attempt:
 * validated options merged over accumulated command `ctx` when those stages ran; otherwise
 * best-effort partial (e.g. early halt or validation error).
 */
export interface PluginAfterCommandHookParams extends PluginHookParams {
  command: CommandDefinition;
  ctx: UnknownRecord;
}

export interface PluginErrorHookParams extends PluginHookParams {
  error: unknown;
  command?: Command;
}

export type PluginHook = (params: PluginHookParams) => Promisable<void>;
/** Must return `execute(...)` or `halt()` so the pipeline can continue or stop cleanly. */
export type PluginBeforeCommandHook = (params: PluginBeforeCommandHookParams) => Promisable<void>;
export type PluginAfterCommandHook = (params: PluginAfterCommandHookParams) => Promisable<void>;
/** Return `true` to indicate the error was handled and stop further propagation. */
export type PluginErrorHook = (params: PluginErrorHookParams) => Promisable<boolean | void>;
