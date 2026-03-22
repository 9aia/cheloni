# Standard Library API Reference

The standard library provides common functionality for building CLI with Cheloni.

## Commands

### `helpCommand`

The help command definition.

```typescript
import { helpCommand } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  command: {
    commands: [helpCommand],
  },
});
```

### `versionCommand`

The version command definition.

```typescript
import { versionCommand } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  command: {
    commands: [versionCommand],
  },
});
```

## Options

### `helpOption`

The help option definition.

```typescript
import { defineRootCommand } from "cheloni";
import { helpOption } from "cheloni/std";

const rootCommand = defineRootCommand({
  bequeathOptions: [helpOption], // Available to all commands
});

const cli = await createCli({
  name: "my-cli",
  command: rootCommand,
});
```

### `versionOption`

The version option definition.

```typescript
import { defineRootCommand } from "cheloni";
import { versionOption } from "cheloni/std";

const rootCommand = defineRootCommand({
  bequeathOptions: [versionOption], // Available to all commands
});

const cli = await createCli({
  name: "my-cli",
  command: rootCommand,
});
```

## Services

### `showHelp({ cli, commandName? })`

Shows help for the CLI or a specific command.

```typescript
import { showHelp } from "cheloni/std";

// Show root help
showHelp({ cli });

// Show command help
showHelp({ cli, commandName: "build" });
```

### Deprecation warnings

These helpers **print deprecation warnings** (to stderr via `console.warn`) based on the CLI/command definition metadata and which args/options were actually provided.

- `showCliDeprecationWarning({ cli })`
- `showCommandDeprecationWarning({ command })`
- `showOptionDeprecationWarnings({ command, parsedOptions })`
- `showPositionalDeprecationWarning({ command, parsedPositionals })`

Note: core does not emit deprecation warnings; install `deprecationPlugin` (below) to run these at the appropriate lifecycle hooks.

### `showVersion({ cliManifest })`

Shows the CLI version.

```typescript
import { showVersion } from "cheloni/std";

showVersion({ cliManifest: cli.manifest });
```

### `validateConfig(config, schema?)`

Validates a resolved config object against an optional Zod schema.

If validation fails, it throws a `ConfigValidationError` and attaches the original `ZodError` as `cause` (which the framework uses to render prettified config validation output).

## Utilities

### `mergeOptionsWith(existingOptions, name, schema)`

Merges an option (with schema) into any Zod options schema.

```typescript
import { mergeOptionsWith } from "cheloni/std";
import { z } from "zod";

const options = mergeOptionsWith(
  z.object({
    verbose: z.boolean(),
  }),
  "debug",
  z.boolean().optional(),
);
```

### `mergeOptionsWithVersion(existingOptions)`

Merges options with version option schema.

```typescript
import { mergeOptionsWithVersion } from "cheloni/std";
import { z } from "zod";

const options = mergeOptionsWithVersion(
  z.object({
    verbose: z.boolean(),
  }),
);
```

## Plugins

### `deprecationPlugin`

Emits deprecation warnings via plugin hooks:

- `onInit`: warns if `cli.manifest.deprecated` is set
- `onCommandExecution`: warns if the matched command is deprecated, and warns for **provided** deprecated options/positionals

This plugin does not change routing or validation; it only emits warnings.

See also: `docs/guides/std/deprecation.md`.

### `helpPlugin`

The help plugin that adds help command and `--help` / `-h` option.

```typescript
import { helpPlugin } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  plugins: [helpPlugin],
});
```

The plugin's `onInit` hook automatically adds the `help` command and `--help` / `-h` global option. If no root command exists, it creates one with help as the default handler.

### `versionPlugin`

The version plugin that adds version command and `--version` / `-v` global option.

```typescript
import { versionPlugin } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  plugins: [versionPlugin],
});
```

The plugin's `onInit` hook automatically adds the `version` command and merges `--version` / `-v` into root options. If no root command exists, it creates one.

### `configPlugin`

The config plugin that adds `--config` / `-c` global option and loads configuration files.

```typescript
import { configPlugin } from "cheloni/std";
import z from "zod";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  plugins: [
    configPlugin({
      c12Options: {
        dotenv: true,
      },
      schema: z.object({ outputDir: z.string() }),
    }),
  ],
});
```

#### Options

- `c12Options?: LoadConfigOptions` - options forwarded to `c12.loadConfig`
- `schema?: z.ZodTypeAny` - Zod schema to validate the merged configuration

The plugin delegates loading/merging to `c12`, validates against `schema` using `validateConfig()` (throwing `ConfigValidationError` on failure), and exposes the resolved config on `ctx.config` (and the resolved main config path as `ctx.configFile` when available).

## Plugin kits

### `basicPluginKit`

Read-only array of the standard plugins: `errorHandlerPlugin`, `helpPlugin`, `versionPlugin`, and `deprecationPlugin`. Spread it into `plugins` (same pattern as `examples/05-task-runner`).

```typescript
import { basicPluginKit } from "cheloni/std/core";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  plugins: [...basicPluginKit],
});
```

The kit provides:

- Help and version support (`help` / `version`, plus `--help` / `--version`)
- Deprecation warnings for deprecated CLIs, commands, and deprecated provided args/options
- Error display via the `error-handler` plugin (handles `onError` at the CLI plugin layer)

This is the recommended way to add that standard library behavior.
