import type { z } from "zod";

export class InvalidSchemaError extends Error {
    readonly issues: ReadonlyArray<z.core.$ZodIssue>;
    
    constructor(message: string, issues: ReadonlyArray<z.core.$ZodIssue>) {
        super(message);
        this.issues = issues;
    }
}

export class InvalidOptionsError extends InvalidSchemaError {
    constructor(message: string, issues: ReadonlyArray<z.core.$ZodIssue>) {
        super(message, issues);
    }
}

export class InvalidOptionError extends InvalidSchemaError {
    constructor(message: string, issues: ReadonlyArray<z.core.$ZodIssue>) {
        super(message, issues);
    }
}

export class InvalidPositionalError extends InvalidSchemaError {
    constructor(message: string, issues: ReadonlyArray<z.core.$ZodIssue>) {
        super(message, issues);
    }
}
