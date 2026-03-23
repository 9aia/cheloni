import type { UnknownArray } from "node_modules/type-fest";
import type { UnknownRecord } from "node_modules/type-fest/source/unknown-record";
import type z from "zod";
import type { NamedArgDef, NamedArgSpec } from "./named-arg";

/** @see {@link option} */
export type OptionSpec<TSchema extends z.ZodTypeAny, TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray,TCtx extends UnknownRecord>
  = NamedArgSpec<TSchema, TValue, TNamedArgs, TPositionals, TCtx>;

/** @see {@link option} */
export type OptionDef<TSchema extends z.ZodTypeAny, TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray,TCtx extends UnknownRecord>
  = NamedArgDef<TSchema, TValue, TNamedArgs, TPositionals, TCtx>
  & Readonly<{ kind: "option" }>;

/**
 * Defines a key-value argument (e.g. `--name 2`)
 * 
 * - Supports a convenient value coercion via schema factory
 *
 * @example
 * option("age", { schema: z => z.number() })
 * option("port", { schema: portSchema })
 * option("name", { schema: z => z.string().min(3), aliases: ["n"] })
 */
export function option<TSchema extends z.ZodTypeAny, TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>(
  name: string,
  spec: OptionSpec<TSchema, TValue, TNamedArgs, TPositionals, TCtx>,
): OptionDef<TSchema, TValue, TNamedArgs, TPositionals, TCtx>;
export function option<TSchema extends z.ZodTypeAny, TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>(
  def: Readonly<{ name: string }> & OptionSpec<TSchema, TValue, TNamedArgs, TPositionals, TCtx>,
): OptionDef<TSchema, TValue, TNamedArgs, TPositionals, TCtx>;
export function option<TSchema extends z.ZodTypeAny, TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>(
  nameOrDef: string | (Readonly<{ name: string }> & OptionSpec<TSchema, TValue, TNamedArgs, TPositionals, TCtx>),
  maybeSpec?: OptionSpec<TSchema, TValue, TNamedArgs, TPositionals, TCtx>,
): OptionDef<TSchema, TValue, TNamedArgs, TPositionals, TCtx> {
  if (typeof nameOrDef === "string") {
    const name = nameOrDef;

    if (maybeSpec == null) {
      throw new TypeError("defineOption(name, spec) requires a spec object");
    }

    return {
      kind: "option",
      name,
      ...maybeSpec,
    };
  }

  const def = nameOrDef;

  return {
    kind: "option",
    ...def,
  };
}

/**
 * Alias for {@link option}.
 */
export const defineOption = option;
