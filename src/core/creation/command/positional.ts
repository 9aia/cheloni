import type { Promisable } from "type-fest";
import type z from "zod";
import type { Command } from "~/core/creation/command";

export interface PositionalParams<TSchema extends z.ZodTypeAny> {
    value: InferPositionalType<TSchema>;
    positional: Positional<TSchema>;
    command: Command;
}

export type PositionalHandler<TSchema extends z.ZodTypeAny> = (params: PositionalParams<TSchema>) => Promisable<void>;

export interface Positional<TSchema extends z.ZodTypeAny> {
    schema: TSchema;
    handler?: PositionalHandler<TSchema>;
};

export type InferPositionalType<TSchema extends z.ZodTypeAny | undefined> =
    [TSchema] extends [z.ZodTypeAny] ? z.infer<TSchema> : undefined;
