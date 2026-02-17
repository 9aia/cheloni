import type { MaybePromise } from "~/lib/ts-utils";
import type z from "zod";
import type { Command } from "~/core/creation/command";

export interface PositionalContext<TSchema extends z.ZodTypeAny> {
    value: InferPositionalType<TSchema>;
    positional: Positional<TSchema>;
    command: Command;
}

export type PositionalHandler<TSchema extends z.ZodTypeAny> = (context: PositionalContext<TSchema>) => MaybePromise<void>;

export interface Positional<TSchema extends z.ZodTypeAny> {
    schema: TSchema;
    handler: PositionalHandler<TSchema>;
};

export type InferPositionalType<TSchema extends z.ZodTypeAny | undefined> = TSchema extends z.ZodTypeAny ? z.infer<TSchema> : undefined;
