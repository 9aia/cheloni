import type z from "zod";
import type { Command } from ".";
import type { Cli } from "~/core/creation/cli";
import type { Promisable, UnknownRecord } from "type-fest";
import type { HaltFunction } from "~/core/execution/command";
import type {
  OptionDefinition,
  OptionSchema,
  OptionsSchema,
} from "~/core/definition/command/option";
import { getOptionManifest, type OptionManifest } from "~/core/manifest/command/option";
import type { RuntimeObject } from "~/utils/creation/runtime-object";
import type { MiddlewareResult, NextFunction } from "~/core/definition/command/middleware";

/**
 * Parameters passed to an option handler when its flag is provided.
 */
export interface OptionHandlerParams<TSchema extends OptionSchema> {
  /** The parsed, validated value of the option. */
  value: z.infer<TSchema>;
  /** The resolved option that triggered this handler. */
  option: Option;
  /** The command being executed. */
  command: Command;
  /** The CLI instance. */
  cli: Cli;
  /** Accumulated context from middleware and earlier option handlers. */
  ctx: UnknownRecord;
  /** Proceed to the next option handler, optionally merging into context (same semantics as command middleware). */
  next: NextFunction<any>;
  /** Halt execution of the command (e.g. after `--help`). */
  halt: HaltFunction;
}

/**
 * A handler function invoked when its option is present in the arguments.
 * Must return the result of calling `next()` (or `next({ ctx: { ... } })` to add context), unless it calls `halt()`.
 *
 * ```ts
 * defineOption({
 *   name: "verbose",
 *   schema: z.boolean().optional(),
 *   handler: async ({ value, next }) => next({ ctx: { verbose: Boolean(value) } }),
 * });
 * ```
 */
export type OptionHandler<TSchema extends OptionSchema> = (
  params: OptionHandlerParams<TSchema>,
) => Promisable<MiddlewareResult<UnknownRecord>>;

/**
 * Runtime object of an {@link OptionDefinition}.
 * This is generally used in `Command.bequeathOptions`.
 */
export interface Option extends RuntimeObject<OptionManifest> {
  definition: OptionDefinition;
}

/**
 * Create a runtime option from its definition, attaching the
 * computed manifest (description, aliases, deprecation, etc.).
 */
export function createOption(definition: OptionDefinition): Option {
  return {
    definition,
    manifest: getOptionManifest(definition.name, definition.schema),
  };
}

/** Infers the TypeScript type from an options schema (`z.infer`), or `{}` when omitted / undefined. */
export type InferOptionsType<TSchema extends OptionsSchema | undefined> = [TSchema] extends [
  undefined,
]
  ? {}
  : z.infer<TSchema>;

/** Controls how unrecognized options are handled during execution. */
export type ExtrageousOptionsBehavior = "throw" | "filter-out" | "pass-through";
