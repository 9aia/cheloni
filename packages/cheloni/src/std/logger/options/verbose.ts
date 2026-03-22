import z from "zod";
import { defineOption } from "~/core/definition/command/option";

function coerceVerbosity(raw: unknown): unknown {
  if (raw === undefined) return undefined;
  if (raw === true) return 1;
  if (raw === false || raw === null) return 0;

  if (Array.isArray(raw)) {
    return raw.length;
  }

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

export default defineOption({
  name: "verbose",
  schema: z
    .any()
    .optional()
    .describe("Increase verbosity (-V, -VV, -VVV). Sets ctx.verbosity and ctx.log.")
    .meta({ aliases: ["V"] }),
  handler: async ({ value, ctx, next }) => {
    const coerced = coerceVerbosity(value);
    const verbosity = typeof coerced === "number" ? coerced : 1;

    return next({
      ctx: {
        verbosity,
        verbose: verbosity > 0,
        ...(ctx.log === undefined ? { log: createVerboseLogger(verbosity) } : {}),
      },
    });
  },
});
