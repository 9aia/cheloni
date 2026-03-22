import type { Promisable, UnknownRecord } from "type-fest";
import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";

/**
 * Result returned from middleware via `next()`.
 */
export type MiddlewareResult<TCtx extends UnknownRecord> = Readonly<{
  ctx: TCtx;
}>;

/**
 * The `next` function available inside middleware.
 *
 * - `next()` — proceed without adding context
 * - `next({ ctx: { ... } })` — merge new properties into context and proceed
 */
export type NextFunction<TCtx extends UnknownRecord> = {
  (): Promise<MiddlewareResult<TCtx>>;
  <T>(opts: { ctx: T }): Promise<MiddlewareResult<TCtx & T>>;
};

/**
 * Parameters passed to a middleware function.
 */
export type MiddlewareParams<TCtx extends UnknownRecord> = Readonly<{
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
}>;

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
export type Middleware<TCtx extends UnknownRecord> = (
  params: MiddlewareParams<TCtx>,
) => Promisable<MiddlewareResult<TCtx>>;

/** Any middleware function (for untyped/dynamic use). */
export type AnyMiddleware = Middleware<any>;

/**
 * Factory for creating a middleware function from some configuration.
 *
 * Useful for std helpers that want to return a middleware parameterized by options.
 */
export type MiddlewareFactory<
  TOptions extends Record<string, any>,
  TMiddleware extends AnyMiddleware,
> = (options: TOptions) => TMiddleware;

/** A middleware array. */
export type MiddlewareArray<TCtx extends UnknownRecord> = Middleware<TCtx>[];

/** Extracts the output context type from a middleware function. */
export type InferMiddlewareContext<TMiddleware extends AnyMiddleware> =
  TMiddleware extends Middleware<infer TCtx> ? TCtx : never;

/** Recursively intersects context types from a tuple of middleware. */
export type InferMiddlewareArrayContext<TMiddlewareArray extends readonly AnyMiddleware[]> =
  TMiddlewareArray extends readonly [
    infer F extends AnyMiddleware,
    ...infer R extends readonly AnyMiddleware[],
  ]
    ? InferMiddlewareContext<F> & InferMiddlewareArrayContext<R>
    : UnknownRecord;

/**
 * Normalizes inferred middleware output context: `next()` yields `MiddlewareResult<{}>`,
 * which should be treated as untyped ctx (`UnknownRecord`), not the empty object type.
 */
export type DefaultMiddlewareCtx<T extends UnknownRecord> = [keyof T] extends [never]
  ? UnknownRecord
  : T;

/**
 * Alias for the middleware function type.
 * @see {@link Middleware}
 */
export type MiddlewareDefinition<TCtx extends UnknownRecord> = Middleware<TCtx>;

/**
 * Defines a standalone middleware function.
 *
 * The middleware must return the result of calling `next()`:
 * ```ts
 * const authMiddleware = defineMiddleware(async ({ next }) => {
 *   const user = await getUser();
 *   return next({ ctx: { user } });
 * });
 * ```
 *
 * For middleware that doesn't add context:
 * ```ts
 * const logMiddleware = defineMiddleware(async ({ next }) => {
 *   console.log('before');
 *   const result = await next();
 *   console.log('after');
 *   return result;
 * });
 * ```
 *
 * Context type `T` is inferred from the `MiddlewareResult<T>` returned by `next()` / `next({ ctx })`.
 * Params use `ctx: {}` so `next` starts as `NextFunction<{}>` and `next({ ctx: { help: true } })`
 * infers `T` as `{ help: true }` instead of widening to `{}`.
 */
export function defineMiddleware<TOut extends UnknownRecord>(
  definition: (params: MiddlewareParams<{}>) => Promisable<MiddlewareResult<TOut>>,
): Middleware<DefaultMiddlewareCtx<TOut>> {
  return definition as Middleware<DefaultMiddlewareCtx<TOut>>;
}

/**
 * Defines a middleware array.
 * Enables type inference for middleware arrays.
 *
 * @example
 * ```ts
 * const myMiddleware = defineMiddlewareArray([
 *   loggerMiddleware,
 *   authMiddleware,
 *   ({ next, ctx }) => {
 *     // ctx.user is typed on the handler via composed middleware
 *     return next();
 *   },
 * ]);
 *
 * defineCommand({
 *   middleware: myMiddleware,
 * });
 *
 * @see {@link defineMiddleware}
 * ```
 */
export function defineMiddlewareArray<
  TMiddlewareArray extends MiddlewareArray<TCtx>,
  TCtx extends UnknownRecord,
>(middleware: TMiddlewareArray): MiddlewareArray<TCtx> {
  return middleware as MiddlewareArray<TCtx>;
}
