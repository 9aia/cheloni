import type z from "zod";

export type PositionalDefinition = z.ZodTypeAny | undefined;

export function definePositional(definition: PositionalDefinition): PositionalDefinition {
    return definition;
}
