import type { Command } from "~/core/creation/command";
import type { Promisable } from "type-fest";
import type { Context } from "~/core/execution/command";

export type NextFunction = () => Promise<void>;

export interface MiddlewareParams {
    command: Command;
    context: Context;
    next: NextFunction;
    halt: () => never;
}

export type Middleware = (params: MiddlewareParams) => Promisable<void>;
