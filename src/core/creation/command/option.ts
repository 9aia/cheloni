import type z from "zod";
import type { Command } from ".";
import type { Cli } from "~/core/creation/cli";
import type { Promisable } from "type-fest";
import type { HaltFunction, Context } from "~/core/execution/command";

export interface OptionHandlerParams<TSchema extends z.ZodTypeAny> {
    value: z.infer<TSchema>;
    option: Option<TSchema>;
    command: Command;
    cli: Cli;
    context: Context;
    halt: HaltFunction;
}

export type OptionHandler<TSchema extends z.ZodTypeAny> = (params: OptionHandlerParams<TSchema>) => Promisable<void>;

export interface Option<TSchema extends z.ZodTypeAny> {
    name: string;
    schema: TSchema;
    handler?: OptionHandler<TSchema>;
}

export type InferOptionsType<TSchema extends z.ZodTypeAny | undefined> =
    [TSchema] extends [z.ZodTypeAny] ? z.infer<TSchema> : {};

export type ExtrageousOptionsBehavior = 'throw' | 'filter-out' | 'pass-through';
