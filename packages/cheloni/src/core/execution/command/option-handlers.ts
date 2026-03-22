import { defu } from "defu";
import type { UnknownRecord } from "type-fest";
import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { NextFunction, MiddlewareResult } from "~/core/definition/command/middleware";
import type { Option, OptionHandler } from "~/core/creation/command/option";
import { halt } from "./halt";

export interface ExecuteBequeathedOptionHandlersOptions {
  invocations: BequeathedOptionInvocation[];
  cli: Cli;
  command: Command;
  initialCtx: UnknownRecord;
}

export interface BequeathedOptionInvocation {
  option: Option;
  parsedValue: unknown;
}

function buildParams(
  ctx: UnknownRecord,
  next: NextFunction<any>,
  cli: Cli,
  command: Command,
  value: unknown,
  option: Option,
) {
  return Object.freeze({ ctx, next, cli, command, halt, value, option });
}

async function executeSlim(
  invocations: BequeathedOptionInvocation[],
  cli: Cli,
  command: Command,
  initialCtx: UnknownRecord,
): Promise<UnknownRecord> {
  let ctx: UnknownRecord = initialCtx;

  const dispatch =
    (i: number) =>
    async (newCtx?: UnknownRecord): Promise<MiddlewareResult<UnknownRecord>> => {
      if (newCtx) {
        ctx = defu(newCtx, ctx) as UnknownRecord;
      }

      if (i >= invocations.length) {
        return { ctx };
      }

      const { option, parsedValue } = invocations[i]!;
      const handler = option.definition.handler as OptionHandler<any>;
      const nextFn = ((opts?: { ctx?: UnknownRecord }) =>
        dispatch(i + 1)(opts?.ctx)) as NextFunction<any>;
      const result = await handler(buildParams(ctx, nextFn, cli, command, parsedValue, option));

      return result ?? { ctx };
    };

  const result = await dispatch(0)();
  return result?.ctx ?? ctx;
}

async function executeSafe(
  invocations: BequeathedOptionInvocation[],
  cli: Cli,
  command: Command,
  initialCtx: UnknownRecord,
): Promise<UnknownRecord> {
  let ctx: UnknownRecord = initialCtx;

  const dispatch = async (
    i: number,
    newCtx?: UnknownRecord,
  ): Promise<MiddlewareResult<UnknownRecord>> => {
    if (newCtx) {
      ctx = defu(newCtx, ctx) as UnknownRecord;
    }

    if (i >= invocations.length) {
      return { ctx };
    }

    const { option, parsedValue } = invocations[i]!;
    const handler = option.definition.handler as OptionHandler<any>;
    let nextCalled = false;
    let nextResolved = false;

    const nextFn = ((opts?: { ctx?: UnknownRecord }) => {
      if (nextCalled) {
        throw new Error("next() called multiple times");
      }
      nextCalled = true;

      return dispatch(i + 1, opts?.ctx).then((result) => {
        nextResolved = true;
        return result;
      });
    }) as NextFunction<any>;

    const result = await handler(buildParams(ctx, nextFn, cli, command, parsedValue, option));

    if (nextCalled && !nextResolved) {
      throw new Error(
        "Option handler resolved before downstream.\n\tYou are probably missing an await or return",
      );
    }

    return result ?? { ctx };
  };

  const result = await dispatch(0);
  return result?.ctx ?? ctx;
}

/**
 * Runs bequeathed option handlers in declaration order, merging context through
 * `next({ ctx })` like command middleware.
 */
export async function executeBequeathedOptionHandlers(
  options: ExecuteBequeathedOptionHandlersOptions,
): Promise<UnknownRecord> {
  const { invocations, cli, command, initialCtx } = options;

  if (invocations.length === 0) {
    return initialCtx;
  }

  if (process.env.NODE_ENV === "production") {
    return executeSlim(invocations, cli, command, initialCtx);
  }

  return executeSafe(invocations, cli, command, initialCtx);
}
