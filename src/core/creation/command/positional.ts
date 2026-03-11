import type { Promisable } from "type-fest";
import type z from "zod";
import type { Command } from "~/core/creation/command";

export type PositionalSchema = z.ZodTypeAny;

export interface PositionalParams<TSchema extends PositionalSchema> {
    value: InferPositionalType<TSchema>;
    positional: Positional<TSchema>;
    command: Command;
}

export type PositionalHandler<TSchema extends PositionalSchema> = (params: PositionalParams<TSchema>) => Promisable<void>;

export interface Positional<TSchema extends PositionalSchema> {
    schema: TSchema;
    handler?: PositionalHandler<TSchema>;
};

export type InferPositionalType<TSchema extends PositionalSchema | undefined> =
    [TSchema] extends [PositionalSchema | undefined] ? z.infer<TSchema> : undefined;
