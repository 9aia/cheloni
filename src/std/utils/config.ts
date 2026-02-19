import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import * as _ from "lodash-es";

export type ConfigScope = "global" | "local" | "explicit";

export interface ConfigFileDescriptor {
    /** Absolute path to the config file */
    path: string;
    /** Where this file came from */
    scope: ConfigScope;
}

export interface LoadedConfigFile extends ConfigFileDescriptor {
    /** Parsed JSON contents */
    config: unknown;
}

export interface ResolvedConfig {
    /** Final merged configuration object (may be `undefined` if no files exist) */
    config: unknown;
    /** All successfully loaded config files in merge order */
    files: LoadedConfigFile[];
}

/**
 * Default local config file: <cwd>/<cli-name>.config.json
 */
export function getLocalConfigPath(cliName: string): string {
    const fileName = `${cliName}.config.json`;
    return path.resolve(process.cwd(), fileName);
}

/**
 * Default global config file:
 * - On Unix:  $XDG_CONFIG_HOME/<cli-name>/config.json  or  ~/.config/<cli-name>/config.json
 * - On Windows: %APPDATA%\\<cli-name>\\config.json  or  <home>\\AppData\\Roaming\\<cli-name>\\config.json
 */
export function getGlobalConfigPath(cliName: string): string {
    const isWin = process.platform === "win32";

    if (isWin) {
        const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
        return path.join(appData, cliName, "config.json");
    }

    const xdgConfigHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
    return path.join(xdgConfigHome, cliName, "config.json");
}

async function readConfigFile(
    descriptor: ConfigFileDescriptor
): Promise<LoadedConfigFile | undefined> {
    try {
        const raw = await fs.readFile(descriptor.path, "utf8");
        // Allow empty files to behave like "{}"
        const json = raw.trim().length === 0 ? {} : JSON.parse(raw);
        return { ...descriptor, config: json };
    } catch (error: any) {
        if (error && typeof error === "object" && (error as any).code === "ENOENT") {
            // Missing file is fine – just ignore
            return undefined;
        }

        // Any other error (permission, parse, etc.) should surface clearly
        throw new Error(
            `Failed to read config file at ${descriptor.path}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}

/**
 * Load and merge configuration files for a CLI.
 *
 * Merge order (lowest → highest precedence):
 *   1. Global config
 *   2. Local config
 *   3. Explicit config path (via --config)
 */
export async function loadConfigForCli(
    cliName: string,
    explicitPath?: string | null
): Promise<ResolvedConfig> {
    const files: LoadedConfigFile[] = [];

    const descriptors: ConfigFileDescriptor[] = [];

    // Global & local defaults are always considered
    descriptors.push(
        { path: getGlobalConfigPath(cliName), scope: "global" },
        { path: getLocalConfigPath(cliName), scope: "local" }
    );

    // If user provided an explicit path, treat it as highest priority
    if (explicitPath) {
        descriptors.push({
            path: path.resolve(explicitPath),
            scope: "explicit",
        });
    }

    for (const descriptor of descriptors) {
        const loaded = await readConfigFile(descriptor);
        if (loaded) {
            files.push(loaded);
        }
    }

    let merged: unknown = undefined;
    for (const file of files) {
        merged = merged === undefined ? file.config : _.merge(merged, file.config);
    }

    return {
        config: merged,
        files,
    };
}
