import type z from "zod";

export type PositionalDefinition = z.ZodTypeAny;

export function definePositional(definition: PositionalDefinition): PositionalDefinition {
    return definition;
}
