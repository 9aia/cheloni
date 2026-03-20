import z from "zod";
import type { ZodTypeAny } from "zod";
import { ConfigValidationError } from "~/std/errors/config";

/**
 * Validate a resolved config object against a Zod schema.
 *
 * @throws {ConfigValidationError} if validation fails.
 */
export function validateConfig(config: unknown, schema?: ZodTypeAny): unknown {
    let validatedConfig: unknown = config ?? {};

    if (!schema) {
        return validatedConfig;
    }

    try {
        validatedConfig = schema.parse(validatedConfig);
        return validatedConfig;
    } catch (error) {
        throw new ConfigValidationError(
            `Config validation failed`,
            error,
        );
    }
}
