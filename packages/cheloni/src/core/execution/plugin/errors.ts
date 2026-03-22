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

export class PluginBeforeCommandExecutionError extends PluginHookError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "PluginBeforeCommandExecutionError";
  }
}

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
