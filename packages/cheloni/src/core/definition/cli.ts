import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { RootCommandDefinition } from "~/core/definition/command";
import type { PluginDefinition } from "~/core/definition/plugin";
import type { Promisable } from "type-fest";

export type CliErrorHandlerParams = { error: unknown; cli: Cli; command?: Command };
export type CliErrorHandler = (params: CliErrorHandlerParams) => Promisable<void>;

export interface CliDefinition {
  /**
   * Display name for help and errors. When omitted, resolved from the nearest `package.json`
   * if {@link CliDefinition.metaUrl} is set.
   */
  name?: string;
  /**
   * Version for help and errors. When omitted, resolved from the nearest `package.json`
   * if {@link CliDefinition.metaUrl} is set.
   */
  version?: string;
  /**
   * Module URL used to find the nearest `package.json` when `name`, `version`, and/or `description`
   * are omitted. Set to `import.meta.url` from your CLI entry file.
   */
  metaUrl?: string | URL;
  /**
   * Short summary for help. When omitted, resolved from the nearest `package.json`
   * if {@link CliDefinition.metaUrl} is set.
   */
  description?: string;
  details?: string;
  deprecated?: boolean | string;
  command?: RootCommandDefinition;
  plugins?: PluginDefinition[];
  /**
   * Custom error handler invoked as a final fallback.
   *
   * - Called when no `plugin.definition.onError` hook handled the error.
   * - Also called for **plugin hook failures** (e.g. `onInit`, `onCommandExecution`, `onError` throwing),
   *   bypassing error-handler plugins to avoid infinite loops.
   */
  onError?: CliErrorHandler;
}

export function defineCli<const T extends CliDefinition>(definition: T): T {
  return definition;
}
