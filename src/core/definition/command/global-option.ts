import type z from "zod";
import type { OptionHandler } from "~/core/creation/command/option";

export interface GlobalOptionDefinition<TSchema extends z.ZodTypeAny = any> {
    name: string;
    schema: TSchema;
    /** Whether to validate the option value against the schema. Defaults to true. */
    validate?: boolean;
    handler?: OptionHandler<TSchema>;
}

export function defineGlobalOption<
    T extends z.ZodTypeAny,
>(
    definition: GlobalOptionDefinition<T>
): GlobalOptionDefinition<T> {
    return definition;
}
