import type { ZodTypeAny } from "zod";
import { ConfigValidationError } from "~/std/config/errors/config";

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
            "Config validation failed",
            error,
        );
    }
}
