import z from "zod";
import { InvalidOptionsError, InvalidPositionalError, InvalidSchemaError } from "~/core/execution/command/errors";

export function showInvalidSchemaErrorWithIssues(error: InvalidSchemaError): void {
    const label = error instanceof InvalidPositionalError
        ? "Invalid positional argument"
        : error instanceof InvalidOptionsError
            ? "Invalid options"
            : "Validation error";

    console.error(`${label}:`);
    console.error(z.prettifyError({ issues: error.issues } as z.ZodError));
}

export function showInvalidSchemaError(error: InvalidSchemaError): void {
    console.error(error.message);
}

export function showGenericError(error: Error): void {
    console.error(`Error: ${error.message}`);
}

export function showUnknownError(): void {
    console.error("An unknown error occurred");
}

export function showError(error: unknown): void {
    if (error instanceof InvalidSchemaError && error.issues.length > 0) {
        showInvalidSchemaErrorWithIssues(error);
        return;
    }

    if (error instanceof InvalidSchemaError) {
        showInvalidSchemaError(error);
        return;
    }

    if (error instanceof Error) {
        showGenericError(error);
        return;
    }

    showUnknownError();
}
