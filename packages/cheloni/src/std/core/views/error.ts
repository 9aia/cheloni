import z from "zod";
import {
  InvalidOptionsError,
  InvalidPositionalError,
  InvalidSchemaError,
} from "~/core/execution/command/errors";
import { ConfigValidationError } from "~/std/config/errors/config";

interface InvalidSchemaErrorWithIssuesParams {
  error: InvalidSchemaError;
}

export function showInvalidSchemaErrorWithIssues({
  error,
}: InvalidSchemaErrorWithIssuesParams): void {
  const label =
    error instanceof InvalidPositionalError
      ? "Invalid positional argument"
      : error instanceof InvalidOptionsError
        ? "Invalid options"
        : "Validation error";

  console.error(`${label}:`);
  console.error(z.prettifyError({ issues: error.issues } as z.ZodError));
}

interface InvalidSchemaErrorParams {
  error: InvalidSchemaError;
}

export function showInvalidSchemaError({ error }: InvalidSchemaErrorParams): void {
  console.error(error.message);
}

interface GenericErrorParams {
  error: Error;
}

export function showGenericError({ error }: GenericErrorParams): void {
  console.error(`Error: ${error.message}`);
}

export function showUnknownError(): void {
  console.error("An unknown error occurred");
}

interface ConfigValidationErrorParams {
  error: ConfigValidationError;
}

function showConfigValidationError({ error }: ConfigValidationErrorParams): void {
  const cause = (error as any).cause;
  const hasZodIssues = cause && typeof cause === "object" && Array.isArray((cause as any).issues);
  if (hasZodIssues) {
    console.error("Config validation error:");
    console.error(z.prettifyError(cause as z.ZodError));
    return;
  }

  console.error(error.message);
}

interface ShowErrorParams {
  error: unknown;
}

export function showError({ error }: ShowErrorParams): void {
  if (error instanceof ConfigValidationError) {
    showConfigValidationError({ error });
    return;
  }

  if (error instanceof InvalidSchemaError && error.issues.length > 0) {
    showInvalidSchemaErrorWithIssues({ error });
    return;
  }

  if (error instanceof InvalidSchemaError) {
    showInvalidSchemaError({ error });
    return;
  }

  if (error instanceof Error) {
    showGenericError({ error });
    return;
  }

  showUnknownError();
}
