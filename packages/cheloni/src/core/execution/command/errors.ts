import { CheloniError } from "~/utils/execution/errors";
import type { z } from "zod";

export class CommandExecutionError extends CheloniError {
  constructor(message: string) {
    super(message);
    this.name = "CommandExecutionError";
  }
}

export class CommandNotFoundError extends CommandExecutionError {
  constructor() {
    super("Command not found");
  }
}

export class InvalidSchemaError extends CommandExecutionError {
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

export class HaltError extends CommandExecutionError {
  constructor() {
    super("Execution halted");
    this.name = "HaltError";
  }
}
