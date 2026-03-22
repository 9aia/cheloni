import { CheloniError } from "~/utils/execution/errors";

export class PluginError extends CheloniError {
  override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "PluginError";
    this.cause = cause;
  }
}

export class PluginHookError extends PluginError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "PluginHookError";
  }
}

export class PluginInitError extends PluginHookError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "PluginInitError";
  }
}

/** Thrown when `onCommandExecution` fails before the inner pipeline completes (or omits `execute` / `halt`). */
export class PluginCommandExecutionError extends PluginHookError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "PluginCommandExecutionError";
  }
}

/**
 * Thrown when code in `onCommandExecution` runs **after** `await execute(...)` resolved and then throws.
 * Routed to `cli.onError` like the former `onAfterCommandExecution` failures; the command outcome is unchanged.
 */
export class PluginAfterCommandExecutionError extends PluginHookError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "PluginAfterCommandExecutionError";
  }
}

export class PluginDestroyError extends PluginHookError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "PluginDestroyError";
  }
}
