import type { Command, HaltFunction } from "src/runtime";
import type { Promisable, UnknownArray, UnknownRecord } from "type-fest";

/** @see {@link defineArgHandler} */
export type ArgHandlerParams<TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>
  = Readonly<{
    /** The parsed, validated value of the argument. */
    value: TValue;
    /** The resolved named arguments. */
    namedArgs: TNamedArgs;
    /** The resolved positional arguments. */
    positionalArgs: TPositionals;
    /** The command being executed. */
    command: Command;
    /** The accumulated context from middleware and earlier argument handlers. */
    ctx: TCtx;
    /** Function to halt execution of the command. */
    halt: HaltFunction;
  }>;

/** @see {@link defineArgHandler} */
export type ArgHandler<TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>
  = (
    params: ArgHandlerParams<TValue, TNamedArgs, TPositionals, TCtx>
  ) => Promisable<void>;

export function defineArgHandler<TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>(
    handler: ArgHandler<TValue, TNamedArgs, TPositionals, TCtx>
): ArgHandler<TValue, TNamedArgs, TPositionals, TCtx> {
    return handler;
}
