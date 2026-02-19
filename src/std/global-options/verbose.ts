import z from "zod";
import { defineGlobalOption } from "~/core/definition/command/global-option";

function coerceVerbosity(raw: unknown): unknown {
    // If the flag is not provided, mri won't include the key at all (undefined)
    if (raw === undefined) return undefined;

    // `--verbose` / `-v`
    if (raw === true) return 1;
    if (raw === false || raw === null) return 0;

    // `-vv`, `-v -v`, `--verbose --verbose` -> arrays
    if (Array.isArray(raw)) {
        // Most common case: [true, true, ...]
        return raw.length;
    }

    // `--verbose=3`
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") {
        const n = Number(raw);
        if (Number.isFinite(n)) return n;
        return raw.length > 0 ? 1 : 0;
    }

    return raw;
}

function createVerboseLogger(verbosity: number) {
    const enabled = (level: number) => verbosity >= level;

    return {
        info: (...args: any[]) => {
            if (enabled(1)) console.log(...args);
        },
        debug: (...args: any[]) => {
            if (enabled(2)) console.log(...args);
        },
        trace: (...args: any[]) => {
            if (enabled(3)) console.log(...args);
        },
        warn: (...args: any[]) => console.warn(...args),
        error: (...args: any[]) => console.error(...args),
    };
}

export default defineGlobalOption({
    name: "verbose",
    // Intentionally keep the schema permissive so we can support all common
    // "verbose" patterns that `mri` produces (-V, -VV, --verbose=3, etc.)
    // without fighting ZodEffects metadata/alias extraction.
    schema: z
        .any()
        .optional()
        .describe("Increase verbosity (-V, -VV, -VVV). Sets context.verbosity and context.log.")
        .meta({ aliases: ["V"] }),
    handler: ({ value, context }) => {
        const coerced = coerceVerbosity(value);
        const verbosity = typeof coerced === "number" ? coerced : 1;

        // Keep names simple and ergonomic for framework users.
        context.verbosity = verbosity;
        context.verbose = verbosity > 0;

        // Provide a convenience logger (only if the user hasn't provided one).
        if (context.log === undefined) {
            context.log = createVerboseLogger(verbosity);
        }
    },
});
