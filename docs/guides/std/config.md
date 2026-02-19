# Configuration

The standard library provides a simple but powerful configuration system built on top of:

- A `--config` / `-c` **global option**
- A `configPlugin` that wires the option into your CLI and handles the config file loading, merging and validation
- A set of **services** and **utils** to resolve and merge config files if you need more control

This page documents how to use it in real CLIs.

## Config Plugin Behavior

The `configPlugin` provides a simplified configuration system that:

- Loads a single config file using precedence order: explicit (`--config`) → local (cwd) → global (OS-specific)
- Uses the **first valid file found** (no merging between files)
- If a file is invalid (parse error or validation error), warns and falls back to the next file in precedence order
- If all files are invalid or missing, uses `defaultConfig` (defaults to `{}`)
- Merges the matched file config with `defaultConfig` if provided
- Validates against a schema if provided

### File Lookup Precedence

The plugin checks for config files in this order, using the first **valid** one found:

1. **Explicit path** (via `--config` / `-c` option)
   - If invalid, warns and tries local
2. **Local config** (current working directory)
   - Uses `defaultFilename` if provided, otherwise `<cli-name>.config.json`
   - If invalid, warns and tries global
3. **Global config** (OS-specific user config directory)
   - Unix: `$XDG_CONFIG_HOME/<cli-name>/config.json` or `~/.config/<cli-name>/config.json`
   - Windows: `%APPDATA%\\<cli-name>\\config.json`
   - If invalid, warns and uses `defaultConfig`

A file is considered invalid if:
- It cannot be read (permission error)
- It contains invalid JSON
- It fails schema validation (if a schema is provided)

### Default filename

By default, the plugin looks for `<cli-name>.config.json` in the current working directory for the local lookup. You can override this with the `defaultFilename` option:

```ts
configPlugin({
  defaultFilename: 'tasks.json', // Uses tasks.json instead of <cli-name>.config.json for local lookup
})
```

Note: `defaultFilename` only affects the local (cwd) lookup, not global or explicit paths.

### Explicit path (`--config` / `-c`)

You can override the lookup with an explicit path:

```sh
my-cli --config ./my-cli.dev.config.json
```

When `--config` is passed, that file is checked first. If it doesn't exist, the plugin falls back to local, then global.

## Low-Level Config Resolution (resolveConfig service)

For advanced use cases that need global/local/explicit merging, use the `resolveConfig` service directly instead of the plugin.

Config is loaded as JSON from up to three locations, merged in this order (lowest → highest precedence):

1. **Global config** (user‑ or system‑wide)
2. **Local config** (project directory)
3. **Explicit config path** (via `--config|-c`)

### Default local path

- Local config lives next to where the CLI is usually run:
  - File name: `<cli-name>.config.json`
  - Resolved as: `getLocalConfigPath(cliName)` → `$CWD/<cli-name>.config.json`

### Default global path

Global config is stored in a per‑user config directory:

- On Unix:
  - `$XDG_CONFIG_HOME/<cli-name>/config.json`, or
  - `~/.config/<cli-name>/config.json`
- On Windows:
  - `%APPDATA%\\<cli-name>\\config.json`, or
  - `<home>\\AppData\\Roaming\\<cli-name>\\config.json`

Resolved via `getGlobalConfigPath(cliName)`.

## Using the std config option and plugin

### Adding the config option manually

You can register the std `config` global option directly:

```ts
import { createCli } from "cheloni";
import { configOption } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  globalOptions: [configOption],
  command: rootCommand,
});
```

### Adding via `configPlugin`

Most CLIs should use the plugin instead of wiring the option manually:

```ts
import { createCli } from "cheloni";
import { configPlugin } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  command: rootCommand,
  plugins: [configPlugin()],
});
```

`configPlugin`:

- Registers the `config` global option on the CLI
- Ensures `--config` / `-c` is available to all commands

### Plugin Options

You can configure the plugin with several options:

#### `defaultConfig`

Provide default configuration that will be merged with any loaded files. File config always takes precedence over defaults:

```ts
const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  command: rootCommand,
  plugins: [
    configPlugin({
      defaultConfig: {
        outputDir: "dist",
        telemetry: false,
      },
    }),
  ],
});
```

If no config file is found, `defaultConfig` is used (defaults to `{}` if not provided).

#### `defaultFilename`

Override the default config filename pattern. By default, the plugin looks for `<cli-name>.config.json`:

```ts
configPlugin({
  defaultFilename: 'tasks.json', // Uses tasks.json instead of <cli-name>.config.json
})
```

#### `schema`

Validate the merged configuration against a Zod schema:

```ts
import z from 'zod';

const configSchema = z.object({
  outputDir: z.string(),
  telemetry: z.boolean(),
});

configPlugin({
  schema: configSchema,
  defaultConfig: {
    outputDir: 'dist',
    telemetry: false,
  },
})
```

If validation fails, a clear error message is thrown with details about what failed.

## What the plugin handler does

The std `configPlugin` handler:

- Looks for config files in precedence order (explicit → local → global):
  - Checks explicit path if `--config` is provided
  - If not found or invalid, checks local (cwd) using `defaultFilename` or `<cli-name>.config.json`
  - If not found or invalid, checks global (OS-specific location)
  - Uses the **first valid file found** (no merging between files)
  - If a file is invalid, warns the user and tries the next file
  - If all files are invalid or missing, uses `defaultConfig`
- Merges the matched file config with `defaultConfig`:
  - File config takes precedence over `defaultConfig`
  - If no valid file exists, uses `defaultConfig` (defaults to `{}`)
- Validates against `schema` if provided:
  - Each file is validated before being used
  - If validation fails, warns and tries the next file
  - If no file passes validation, validates `defaultConfig` (throws error if invalid)
- Exposes the result on the execution context:
  - `context.config` – merged configuration object (always defined, at least `{}`)
  - `context.configFiles` – array of `{ path, scope }` describing the loaded file:
    - `scope` is `"explicit" | "local" | "global"`

Example handler usage:

```ts
const build = defineCommand({
  name: "build",
  handler: async ({ context }) => {
    const cfg = context.config as any | undefined;
    const outputDir = cfg?.outputDir ?? "dist";

    console.log(`Building into: ${outputDir}`);
  },
});
```

> **Note**  
> If you provide a `schema` option, the config will be validated and typed.  
> Otherwise, treat `context.config` as `unknown` and narrow/validate it in user land as needed.

## Using the high‑level service directly

If you don’t want to rely on the global option handler, you can resolve config manually:

```ts
import { resolveConfig } from "cheloni/std";

const { config, files } = await resolveConfig(cli);
// config -> merged global + local config
// files  -> which files were used and from where
```

Or with an explicit path:

```ts
const { config } = await resolveConfig(cli, "./my-cli.dev.config.json");
```

This is useful for:

- Custom configuration flows
- CLIs that want to resolve config before parsing args

## Low‑level utilities

For advanced use cases, std exports the low‑level helpers from `std/utils/config`:

- `getLocalConfigPath(cliName)` – compute the default local JSON path
- `getGlobalConfigPath(cliName)` – compute the default global JSON path
- `loadConfigForCli(cliName, explicitPath?)` – read and merge config without a `Cli` instance
  - Returns `{ config, files }`

These are re‑exported from `cheloni/std` for convenience.

