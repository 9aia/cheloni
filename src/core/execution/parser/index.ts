import mri from "mri";
import type z from "zod";

export function parseArgs(args: string[], aliasMap: Record<string, string | string[]> = {}) {
    const argv = mri(args, {
        boolean: [],
        string: [],
        alias: aliasMap,
        default: {},
    });

    const positional = argv._
    const { _, ...options } = argv;

    return { positional, options };
}

export function extractPositionalValue(
    schema: z.ZodTypeAny | undefined,
    args: string[],
    index: number
): any {
    if (!schema) {
        return undefined;
    }

    if (index < args.length) {
        return args[index];
    }

    return undefined;
}
