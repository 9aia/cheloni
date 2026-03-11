import type { Middleware, MiddlewareResult, MiddlewareParams, AnyMiddleware } from "~/core/creation/command/middleware";
import type { Promisable, UnknownRecord } from "type-fest";

/**
 * A function that runs sequentially before the command handler.
 */
export type MiddlewareDefinition = Middleware;

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
 */
export function defineMiddleware<
    TCtxOut extends UnknownRecord = UnknownRecord,
>(
    definition: (params: MiddlewareParams) => Promisable<MiddlewareResult<TCtxOut>>,
): Middleware<TCtxOut> {
    return definition as Middleware<TCtxOut>;
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
 *   ({ next, context }) => {
 *     // context.user is typed
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
export function defineMiddlewareArray<T extends AnyMiddleware[]>(middleware: T): AnyMiddleware[] {
    return middleware;
}
