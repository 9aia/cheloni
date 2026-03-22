import mri from "mri";
import type z from "zod";

export function parseArgs(args: string[], aliasMap: Record<string, string[]> = {}) {
  // mri mutates alias arrays via .shift() — clone to protect schema metadata
  const clonedAliasMap: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(aliasMap)) {
    clonedAliasMap[key] = [...value];
  }

  const argv = mri(args, {
    boolean: [],
    string: [],
    alias: clonedAliasMap,
    default: {},
  });

  const positional = argv._;
  const { _, ...options } = argv;

  return { positional, options };
}

export function extractPositionalValue(
  schema: z.ZodTypeAny | undefined,
  args: string[],
  index: number,
): any {
  if (!schema) {
    return undefined;
  }

  if (index < args.length) {
    return args[index];
  }

  return undefined;
}
