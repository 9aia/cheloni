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
 * Run the next `onCommandExecution` hooks, then middleware, validation, and the handler.
 * Pass `ctx` to deep-merge into command context (same merge rules as middleware `next({ ctx })`).
 * Resolves with the post-attempt context snapshot: validated options merged over accumulated command
 * `ctx` when those stages completed; otherwise best-effort partial (e.g. early halt or validation error).
 */
export type PluginCommandExecuteFn = (opts?: { ctx?: UnknownRecord }) => Promisable<UnknownRecord>;

export interface PluginCommandExecutionHookParams extends PluginCommandHookParams {
  execute: PluginCommandExecuteFn;
  /** Stop the command pipeline without error (same as command middleware `halt`). */
  halt: HaltFunction;
}

export interface PluginErrorHookParams extends PluginHookParams {
  error: unknown;
  command?: Command;
}

export type PluginHook = (params: PluginHookParams) => Promisable<void>;
/**
 * Wrap the rest of the pipeline: call `await execute({ ctx })`, then run your teardown logic.
 * Must **return** `await execute(...)` or `halt()`.
 */
export type PluginCommandExecutionHook = (
  params: PluginCommandExecutionHookParams,
) => Promisable<UnknownRecord | void>;
/** Return `true` to indicate the error was handled and stop further propagation. */
export type PluginErrorHook = (params: PluginErrorHookParams) => Promisable<boolean | void>;
