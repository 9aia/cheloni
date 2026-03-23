import type { UnknownArray, UnknownRecord } from "type-fest";
import z from "zod";
import type { NamedArgDef, NamedArgSpec } from "./named-arg";

/** @see {@link flag} */
export type FlagSpec<TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>
  = NamedArgSpec<z.ZodType, TValue, TNamedArgs, TPositionals, TCtx>;

/** @see {@link flag} */
export type FlagDef<TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>
  = NamedArgDef<z.ZodType, TValue, TNamedArgs, TPositionals, TCtx>
  & Readonly<{ kind: "flag" }>;
  
/**
 * Defines a presence-driven argument, e.g. `--cache`. 
 * 
 * - Supports a convenient optional boolean schema via schema factory.
 * - Supports inline polarity (default: `--no-<flagName>`), e.g. `--no-cache`
 * - Supports inline grouping, e.g. `-Rns`
 * 
 * @example
 * flag("verbose", { schema: z => z.optional() })
 * flag("verbose", { schema: z.int().nonnegative().default(1), aliases: ["v"] })
 * 
 * flag("verbose", {
 *   schema: z => z.optional(),
 *   aliases: ["v"],
 *   description: "Enable verbose logging",
 *   handler: async ({ command, halt }) => {
 *     console.log("Verbose mode enabled");
 *   },
 * });
 */
export function flag<TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>(
  name: string,
  spec: FlagSpec<TValue, TNamedArgs, TPositionals, TCtx>,
): FlagDef<TValue, TNamedArgs, TPositionals, TCtx>;
export function flag<TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>(
  def: Readonly<{ name: string }> & FlagSpec<TValue, TNamedArgs, TPositionals, TCtx>,
): FlagDef<TValue, TNamedArgs, TPositionals, TCtx>;
export function flag<TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>(
  nameOrDef: string | (Readonly<{ name: string }> & FlagSpec<TValue, TNamedArgs, TPositionals, TCtx>),
  maybeSpec?: FlagSpec<TValue, TNamedArgs, TPositionals, TCtx>,
): FlagDef<TValue, TNamedArgs, TPositionals, TCtx> {
  if (typeof nameOrDef === "string") {
    const name = nameOrDef;

    if (maybeSpec == null) {
      throw new TypeError("defineFlag(name, spec) requires a spec object");
    }

    return {
      kind: "flag",
      name,
      ...maybeSpec,
    };
  }

  const def = nameOrDef;

  return {
    kind: "flag",
    ...def,
  };
}

/**
 * Alias for {@link flag}.
 */
export const defineFlag = flag;
