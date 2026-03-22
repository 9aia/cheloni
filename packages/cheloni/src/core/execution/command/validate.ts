import z from "zod";
import type { InferOptionsType } from "~/core/creation/command/option";
import type { Command } from "~/core/creation/command";
import type { InferPositionalType, PositionalSchema } from "~/core/creation/command/positional";
import type { OptionsSchema } from "~/core/definition/command/option";
import { extractPositionalValue } from "../parser";
import { InvalidOptionsError, InvalidPositionalError } from "./errors";

export function getValidOptionNames(optionsSchema: OptionsSchema | undefined): Set<string> {
  const validOptionNames = new Set<string>();

  const object = optionsSchema?.shape;
  if (!object) {
    return validOptionNames;
  }

  for (const [optionName, schema] of Object.entries(object)) {
    validOptionNames.add(optionName);

    const meta = schema.meta() ?? ({} as Record<string, unknown>);
    const aliases = (meta.aliases as string[]) || [];

    // Add aliases to the valid set
    for (const aliasName of aliases) {
      validOptionNames.add(aliasName);
    }
  }

  return validOptionNames;
}

export function validateOptionsExist(
  rawOptions: Record<string, any>,
  definedOptions: OptionsSchema | undefined,
  behavior: "throw" | "filter-out" | "pass-through",
  inheritedOptionNames: Set<string> = new Set(),
): Record<string, any> {
  if (!definedOptions) {
    // Command defines no options — only global options are allowed (unless pass-through)
    const providedOptionNames = Object.keys(rawOptions);
    const nonInheritedOptions = providedOptionNames.filter((opt) => !inheritedOptionNames.has(opt));

    if (nonInheritedOptions.length > 0 && behavior === "throw") {
      throw new InvalidOptionsError(
        `Unknown options provided: ${nonInheritedOptions.map((opt) => `--${opt}`).join(", ")}. This command does not accept any options.`,
        [],
      );
    }

    if (behavior === "filter-out") {
      const filtered: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawOptions)) {
        if (inheritedOptionNames.has(key)) {
          filtered[key] = value;
        }
      }
      return filtered;
    }

    // For both 'throw' (after validation) and 'pass-through', keep parsed values so
    // global options can still execute (e.g. `-h`, `--version`, `-v`).
    return rawOptions;
  }

  const validOptionNames = getValidOptionNames(definedOptions);
  // Merge command option names with global option names
  const allValidOptionNames = new Set([...validOptionNames, ...inheritedOptionNames]);
  const providedOptionNames = Object.keys(rawOptions);
  const unknownOptions = providedOptionNames.filter((opt) => !allValidOptionNames.has(opt));

  if (unknownOptions.length > 0 && behavior === "throw") {
    // Build list of available options with their aliases
    const object = definedOptions?.shape;
    const knownOptions = object
      ? Object.entries(object).map(([name, schema]) => {
          const meta = schema.meta() ?? ({} as Record<string, unknown>);
          const aliases = (meta.aliases as string[]) || [];
          if (aliases.length > 0) {
            const aliasStr = aliases.map((a: string) => `-${a}`).join(", ");
            return `--${name} (${aliasStr})`;
          }
          return `--${name}`;
        })
      : [];

    throw new InvalidOptionsError(
      `Unknown options provided: ${unknownOptions.map((opt) => `--${opt}`).join(", ")}.\n` +
        (knownOptions.length > 0
          ? `Available options: ${knownOptions.join(", ")}`
          : "This command does not accept any options."),
      [],
    );
  }

  if (behavior === "filter-out") {
    const filteredOptions: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawOptions)) {
      if (allValidOptionNames.has(key)) {
        filteredOptions[key] = value;
      }
    }
    return filteredOptions;
  }

  return rawOptions;
}

export function validatePositional<T extends PositionalSchema>(
  positionalSchema: T | undefined,
  positionalArgs: string[],
): InferPositionalType<T> {
  if (!positionalSchema) {
    return undefined as InferPositionalType<T>;
  }

  const positionalValue = extractPositionalValue(positionalSchema, positionalArgs, 0);

  try {
    return positionalSchema.parse(positionalValue) as InferPositionalType<T>;
  } catch (error) {
    const zodError = error as z.ZodError;
    throw new InvalidPositionalError(zodError.message, zodError.issues);
  }
}

export function validateOptions<T extends OptionsSchema>(
  optionsSchema: T | undefined,
  validatedOptions: Record<string, any>,
  extrageousOptionsBehavior: "throw" | "filter-out" | "pass-through",
  // TODO: implement this
  _bequeathOptions: Command["bequeathOptions"],
): InferOptionsType<T> {
  if (!optionsSchema) {
    return validatedOptions as InferOptionsType<T>;
  }

  const validOptionNames = getValidOptionNames(optionsSchema);

  const optionsForZod: Record<string, any> = {};
  const extraOptions: Record<string, any> = {};

  for (const [key, value] of Object.entries(validatedOptions)) {
    if (validOptionNames.has(key)) {
      optionsForZod[key] = value;
    } else if (extrageousOptionsBehavior === "pass-through") {
      extraOptions[key] = value;
    }
  }

  const parsed = optionsSchema.parse(optionsForZod) as InferOptionsType<T>;

  if (extrageousOptionsBehavior === "pass-through") {
    return Object.assign({}, parsed, extraOptions) as InferOptionsType<T>;
  }

  return parsed;
}
