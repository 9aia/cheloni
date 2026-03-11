import type z from "zod";

/**
 * A Zod schema that defines a reusable positional argument of a command.
 */
export type PositionalDefinition = z.ZodTypeAny;

/**
 * Defines a reusable positional argument.
 *
 * @example
 * const positional = definePositional(z.string());
 */
export function definePositional(definition: PositionalDefinition): PositionalDefinition {
    return definition;
}
