export type VariadicDef = {
  readonly name: string;
  readonly schema: z.ZodTypeAny;
  readonly description?: string;
  readonly examples?: string[];
};

export function variadic(name: string, spec: VariadicSpec): VariadicDef;

/**
 * Alias for {@link variadic}.
 */
export const defineVariadic = variadic;
