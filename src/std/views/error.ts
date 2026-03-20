import z from "zod";
import { InvalidOptionsError, InvalidPositionalError, InvalidSchemaError } from "~/core/execution/command/errors";

interface InvalidSchemaErrorWithIssuesParams {
    error: InvalidSchemaError;
}

export function showInvalidSchemaErrorWithIssues({ error }: InvalidSchemaErrorWithIssuesParams): void {
    const label = error instanceof InvalidPositionalError
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

interface ShowErrorParams {
    error: unknown;
}

export function showError({ error }: ShowErrorParams): void {
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

