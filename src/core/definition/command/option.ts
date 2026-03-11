import type z from "zod";
import type { OptionHandler } from "~/core/creation/command/option";

/**
 * Zod schema defining a command option.
 */
export type OptionSchema = z.ZodTypeAny;

/**
 * Zod schema defining a command options.
 */
export type OptionsSchema = z.ZodObject<Record<string, OptionSchema>>;

/**
 * A reusable, named option that can be shared across commands
 * via `bequeathOptions`. Supports an optional Zod schema for
 * validation and an optional handler that runs when the option
 * is provided.
 */
export interface OptionDefinition<TSchema extends OptionSchema = OptionSchema> {
    name: string;
    schema?: TSchema;
    handler?: OptionHandler<TSchema>;
}

/**
 * Defines an inline option schema for use inside a `z.object()`.
 *
 * @example
 * const force = defineOption(z.boolean().optional());
 * defineCommand({ options: z.object({ force }) });
 */
export function defineOption<T extends OptionSchema>(schema: T): T;
/**
 * Defines a reusable, named option that can be passed to
 * `bequeathOptions` so subcommands inherit it automatically.
 *
 * @example
 * const dryRun = defineOption({
 *   name: "dry-run",
 *   schema: z.boolean().default(false),
 *   handler: ({ value, context }) => {
 *     if (value) {
 *       context.actions.push("Simulating actions in dry-run mode");
 *     }
 *   },
 * });
 */
export function defineOption<T extends OptionSchema>(definition: OptionDefinition<T>): OptionDefinition<T>;
export function defineOption(definition: any): any {
    return definition;
}
