import type { Command } from "~/core/creation/command";
import type { MaybePromise } from "~/lib/ts-utils";
import type { Context } from "~/core/execution/command";

export type NextFunction = () => Promise<void>;

export interface MiddlewareParams {
    command: Command;
    context: Context;
    next: NextFunction;
    halt: () => never;
}

export type Middleware = (params: MiddlewareParams) => MaybePromise<void>;
