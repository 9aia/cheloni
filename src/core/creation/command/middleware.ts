import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { Promisable, UnknownRecord } from "type-fest";

/**
 * Result returned from middleware via `next()`.
 */
export interface MiddlewareResult<TCtx extends UnknownRecord = UnknownRecord> {
    ctx: TCtx;
}

/**
 * The `next` function available inside middleware.
 *
 * - `next()` — proceed without adding context
 * - `next({ ctx: { ... } })` — merge new properties into context and proceed
 */
export interface NextFunction<TCtx extends UnknownRecord = UnknownRecord> {
    (): Promise<MiddlewareResult<TCtx>>;
    <T extends UnknownRecord>(opts: { ctx: T }): Promise<MiddlewareResult<TCtx & T>>;
}

/**
 * Parameters passed to a middleware function.
 */
export type MiddlewareParams<TCtx extends UnknownRecord = UnknownRecord> = Readonly<{
    /** Accumulated context from previous middleware. */
    ctx: TCtx;
    /** Call to proceed to the next middleware, optionally adding context. */
    next: NextFunction<TCtx>;
    /** The CLI being executed. */
    cli: Cli;
    /** The command being executed. */
    command: Command;
    /** Halt execution of the command and remaining middleware. */
    halt: () => never;
}>

/**
 * A middleware function.
 *
 * Must return the result of calling `next()`:
 * ```ts
 * defineMiddleware(async ({ next }) => {
 *   return next({ ctx: { user: await getUser() } });
 * })
 * ```
 */
export type Middleware<
    TCtxOut extends UnknownRecord = UnknownRecord,
> = (params: MiddlewareParams<any>) => Promisable<MiddlewareResult<TCtxOut>>;

/** Any middleware function (for untyped/dynamic use). */
export type AnyMiddleware = Middleware<any>;

/** Extracts the output context type from a middleware function. */
export type InferMiddlewareContext<T> =
    T extends (...args: any[]) => Promisable<MiddlewareResult<infer R>> ? R : UnknownRecord;

/** Recursively intersects context types from a tuple of middleware. */
export type InferComposedContext<T extends AnyMiddleware[]> =
    T extends [infer First extends AnyMiddleware, ...infer Rest extends AnyMiddleware[]]
        ? InferMiddlewareContext<First> & InferComposedContext<Rest>
        : {};
