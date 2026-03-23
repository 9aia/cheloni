import type { UnknownArray, UnknownRecord } from "type-fest";
import z from "zod";
import type { ArgHandler } from "./arg-handler";

export type ArgSpec<TSchema extends z.ZodTypeAny, TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>
  = Readonly<{
    /** Short description of the argument. */
    description?: string;
    /** Long description of the argument. */
    details?: string;
    /** Examples of the argument. */
    examples?: string[];
    /**
     * Schema used to validate the argument.
     * 
     * @example
     * ```ts
     * defineFlag({
     *   name: "username",
     *   schema: z.string().min(1).max(20),
     * });
     * ```
     */
    schema: TSchema | ((z: TSchema) => TSchema);
    /**
     * Handler for the argument.
     * @example
     * ```ts
     * defineFlag({
     *   name: "help",
     *   handler: async ({ command, halt }) => {
     *     showHelp({ commandManifest: command.manifest });
     *     return halt();
     *   },
     * });
     * ```
     */
    handler?: ArgHandler<TValue, TNamedArgs, TPositionals, TCtx>;
  }>;

export type ArgDef<TSchema extends z.ZodTypeAny, TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>
  = ArgSpec<TSchema, TValue, TNamedArgs, TPositionals, TCtx>
  & Readonly<{
    kind: "option" | "flag" | "positionals";
    /** Identifier for the argument. */
    name: string;
  }>;
