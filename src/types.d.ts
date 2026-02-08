import type { z } from "zod";

type MaybePromise<T> = T | Promise<T>;

export type Middleware = () => void;

export type InferPositionalType<T extends z.ZodTypeAny | undefined> = T extends z.ZodTypeAny ? z.infer<T> : undefined;

export type InferOptionsType<T extends z.ZodTypeAny | undefined> = T extends z.ZodTypeAny ? z.infer<T> : {};

export type HandlerContext<
    TPositional extends z.ZodTypeAny | undefined,
    TOptions extends z.ZodTypeAny | undefined
> = {
    positional: InferPositionalType<TPositional>;
    options: InferOptionsType<TOptions>;
};

export type Handler<
    TPositional extends z.ZodTypeAny | undefined,
    TOptions extends z.ZodTypeAny | undefined
> = (context: HandlerContext<TPositional, TOptions>) => MaybePromise<void>;

export type ExtrageousOptionsBehavior = 'throw' | 'filter-out' | 'pass-through';

export interface Command<
    TPositional extends z.ZodTypeAny | undefined = any,
    TOptions extends z.ZodTypeAny | undefined = any
> {
    paths?: string[];
    positional?: TPositional;
    options?: TOptions;
    middleware?: Array<Middleware>;
    throwOnExtrageousOptions?: ExtrageousOptionsBehavior;
    example?: string | string[];
    handler: Handler<TPositional, TOptions>;
}


export interface Manifest {
    [key: string]: Command;
}
