import type { Cli } from "~/core/creation/cli";
import { loadConfigForCli } from "~/std/utils/config";

export interface ConfigResolutionResult {
    /** Final merged configuration object (may be `undefined` if no files exist) */
    config: unknown;
    /** All successfully loaded config files in merge order */
    files: {
        path: string;
        scope: "global" | "local" | "explicit";
    }[];
}

/**
 * Resolve configuration for a given CLI, optionally honoring an explicit path.
 *
 * This is the high-level entry point std users should call from handlers or middleware.
 */
export async function resolveConfig(
    cli: Cli,
    explicitPath?: string | null
): Promise<ConfigResolutionResult> {
    const cliName = cli.manifest.name;
    const result = await loadConfigForCli(cliName, explicitPath);

    return {
        config: result.config,
        files: result.files.map(f => ({
            path: f.path,
            scope: f.scope,
        })),
    };
}

