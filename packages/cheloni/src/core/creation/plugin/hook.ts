import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { CommandDefinition } from "~/core/definition/command";
import type { DefaultMiddlewareCtx, MiddlewareArray } from "~/core/definition/command/middleware";
import type { Plugin } from "~/core/creation/plugin";
import type { HaltFunction } from "~/core/execution/command/halt";
import type { Promisable, UnknownRecord } from "type-fest";

export interface PluginHookParams {
  cli: Cli;
  plugin: Plugin;
}

/** Shared fields for command-scoped plugin hooks (parsed argv is only meaningful before validation). */
export interface PluginCommandHookParams extends PluginHookParams {
  commandDefinition: CommandDefinition;
  parsedOptions?: Record<string, any>;
  parsedPositionals?: string[];
}

/**
 * The `execute` function inside `onCommandExecution` (typed variant for {@link definePluginCommandExecutionHook}).
 *
 * - `execute()` — proceed without adding context
 * - `execute({ ctx: { ... } })` — merge new properties into context and proceed
 */
export type PluginExecuteFunction<TCtx extends UnknownRecord> = {
  (): Promisable<DefaultMiddlewareCtx<TCtx>>;
  <T extends UnknownRecord>(opts: { ctx: T }): Promisable<DefaultMiddlewareCtx<TCtx & T>>;
};

/**
 * Run the next `onCommandExecution` hooks, then middleware, validation, and the handler.
 * Pass `ctx` to deep-merge into command context (same merge rules as middleware `next({ ctx })`).
 * Resolves with the post-attempt context snapshot: validated options merged over accumulated command
 * `ctx` when those stages completed; otherwise best-effort partial (e.g. early halt or validation error).
 */
export type PluginCommandExecuteFn<TCtx extends UnknownRecord> = (opts?: {
  ctx?: TCtx;
}) => Promisable<DefaultMiddlewareCtx<TCtx>>;

export interface PluginCommandExecutionHookParams<
  TCtx extends UnknownRecord,
> extends PluginCommandHookParams {
  execute: PluginCommandExecuteFn<TCtx>;
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
export type PluginCommandExecutionHook<TCtx extends UnknownRecord> = (
  params: PluginCommandExecutionHookParams<TCtx>,
) => Promisable<DefaultMiddlewareCtx<TCtx> | void>;
/** Return `true` to indicate the error was handled and stop further propagation. */
export type PluginErrorHook = (params: PluginErrorHookParams) => Promisable<boolean | void>;
