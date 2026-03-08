import { defu } from "defu";
import type { UnknownRecord } from "type-fest";
import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { AnyMiddleware, MiddlewareResult, NextFunction } from "~/core/creation/command/middleware";
import { halt } from "~/core/execution/command";

/**
 * Options for executing a middleware chain.
 */
export interface ExecuteMiddlewareOptions {
    middleware: AnyMiddleware[];
    cli: Cli;
    command: Command;
}

/**
 * Execute a middleware chain, accumulating context through `next({ ctx })` calls.
 * Returns the final accumulated context.
 *
 * Uses a slim executor in production and a safe executor (with next()-usage
 * validation) in development.
 */
export async function executeMiddleware(
    options: ExecuteMiddlewareOptions,
): Promise<UnknownRecord> {
    const { middleware, cli, command } = options;

    if (middleware.length === 0) {
        return {};
    }

    for (const fn of middleware) {
        if (typeof fn !== "function") {
            throw new TypeError("Middleware must be composed of functions!");
        }
    }

    if (process.env.NODE_ENV === "production") {
        return executeSlim(middleware, cli, command);
    }

    return executeSafe(middleware, cli, command);
}


/**
 * Build a frozen params object for a middleware invocation.
 */
function buildParams(
    ctx: UnknownRecord,
    next: NextFunction<any>,
    cli: Cli,
    command: Command,
) {
    return Object.freeze({ ctx, next, cli, command, halt });
}

/**
 * Production-optimized middleware executor — no safety checks.
 */
async function executeSlim(
    middleware: AnyMiddleware[],
    cli: Cli,
    command: Command,
): Promise<UnknownRecord> {
    let ctx: UnknownRecord = {};

    const dispatch = (i: number) => async (newCtx?: UnknownRecord): Promise<MiddlewareResult<UnknownRecord>> => {
        if (newCtx) {
            ctx = defu(newCtx, ctx) as UnknownRecord;
        }

        if (i >= middleware.length) {
            return { ctx };
        }

        const fn = middleware[i]!;
        const next = ((opts?: { ctx?: UnknownRecord }) => dispatch(i + 1)(opts?.ctx)) as NextFunction<any>;
        const result = await fn(buildParams(ctx, next, cli, command));

        return result ?? { ctx };
    };

    const result = await dispatch(0)();
    return result?.ctx ?? ctx;
}

/**
 * Development middleware executor — validates next() usage.
 */
async function executeSafe(
    middleware: AnyMiddleware[],
    cli: Cli,
    command: Command,
): Promise<UnknownRecord> {
    let ctx: UnknownRecord = {};

    const dispatch = async (i: number, newCtx?: UnknownRecord): Promise<MiddlewareResult<UnknownRecord>> => {
        if (newCtx) {
            ctx = defu(newCtx, ctx) as UnknownRecord;
        }

        if (i >= middleware.length) {
            return { ctx };
        }

        const fn = middleware[i]!;
        let nextCalled = false;
        let nextResolved = false;

        const next = ((opts?: { ctx?: UnknownRecord }) => {
            if (nextCalled) {
                throw new Error("next() called multiple times");
            }
            nextCalled = true;

            return dispatch(i + 1, opts?.ctx).then((result) => {
                nextResolved = true;
                return result;
            });
        }) as NextFunction<any>;

        const result = await fn(buildParams(ctx, next, cli, command));

        if (nextCalled && !nextResolved) {
            throw new Error(
                "Middleware resolved before downstream.\n\tYou are probably missing an await or return",
            );
        }

        return result ?? { ctx };
    };

    const result = await dispatch(0);
    return result?.ctx ?? ctx;
}
