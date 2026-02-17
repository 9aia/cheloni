import type { Command } from "~/core/creation/command";

export type MiddlewareData = {
    [key: string]: any;
};

export type NextFunction = (args: { data: MiddlewareData }) => Promise<void>;

export interface MiddlewareContext {
    command: Command;
    data: MiddlewareData;
    next: NextFunction;
}

export type Middleware = (context: MiddlewareContext) => Promise<void>;
