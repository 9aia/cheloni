import type z from "zod";

export type OptionDefinition = z.ZodTypeAny | undefined;

export function defineOption(definition: OptionDefinition): OptionDefinition {
    return definition;
}
