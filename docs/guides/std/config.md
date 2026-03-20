# Configuration

The standard library provides a simple but powerful configuration system built on top of:

- A `--config` / `-c` **option**
- A `configPlugin` that wires the option into your CLI and handles the config file loading, merging and validation
- A set of **services** and **utils** to resolve and merge config files if you need more control

This page documents how to use it in real CLIs.

## Config Plugin Behavior

The `configPlugin` provides a simplified configuration system that:

- Delegates config loading and merging to `c12.loadConfig` (via `c12Options`)
- Supports an explicit config file via `--config` / `-c`
- Validates the final resolved configuration against a Zod schema if `schema` is provided (via `validateConfig()`, throwing `ConfigValidationError` on failure)

### Configuration Sources (c12)

The plugin delegates config resolution to `c12.loadConfig`.

- For the default behavior, `c12Options` are forwarded directly to c12 (this includes things like `dotenv`, rc files, environment-specific overrides, `extends`, etc.).
- If `--config` / `-c` is provided, that file is used as the main config for this run (with rc/packageJson disabled for the explicit file).

## Advanced: pass `c12` options

If you need more control over how config is resolved (for example: `dotenv`, rc files, env-specific keys, remote layers via `extends`, etc.), pass them directly via `c12Options`.

```ts
import z from "zod";

configPlugin({
  schema: z.object({ outputDir: z.string() }),
  c12Options: {
    dotenv: true,
    envName: "development",
  },
});
```

## Using the std config option and plugin

### Adding the config option manually

You can register the std `config` option directly via `bequeathOptions` on the root command:

```ts
import { createCli, defineRootCommand } from "cheloni";
import { configOption } from "cheloni/std";

const rootCommand = defineRootCommand({
  bequeathOptions: [configOption],
  commands: [/* ... */],
});

const cli = await createCli({
  name: "my-cli",
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

- Registers the `config` option on the CLI
- Ensures `--config` / `-c` is available to all commands

### Plugin Options
- `c12Options?: LoadConfigOptions` — forwarded to `c12.loadConfig`
- `schema?: z.ZodTypeAny` — validates the final resolved config and throws if invalid

## What the plugin handler does

The std `configPlugin` handler:

- Delegates config resolution/merging to `c12.loadConfig` using `c12Options` (and uses `--config` as the main config file when provided)
- Validates against `schema` (if provided) using `validateConfig()` and throws a `ConfigValidationError` on failure (the original Zod error is kept as the `cause`)
- Exposes the validated result on the execution context via `configMiddleware`:
  - `context.config` – merged configuration object (always defined, at least `{}`)
  - `context.configFile` – the resolved main config file (when available)

Example handler usage:

```ts
const build = defineCommand({
  name: "build",
  handler: async ({ context }) => {
    const cfg = context.config as any;
    const outputDir = cfg?.outputDir ?? "dist";

    console.log(`Building into: ${outputDir}`);
  },
});
```

> **Note**  
> If you provide a `schema` option, the config will be validated and typed.  
> Otherwise, treat `context.config` as `unknown` and narrow/validate it in user land as needed.

## Using c12 directly

For custom configuration flows, `cheloni/std` re-exports `loadConfig` from `c12`:

```ts
import { loadConfig } from "cheloni/std";

const { config } = await loadConfig({
  name: "my-cli",
  // cwd, configFile, dotenv, overrides, extends, ...
});
```

If you also want to validate a resolved config yourself, `cheloni/std` exports `validateConfig()`:

```ts
import { validateConfig } from "cheloni/std";
import z from "zod";

const schema = z.object({ outputDir: z.string() });
const validatedConfig = validateConfig(config, schema);
```
