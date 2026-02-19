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
    commands: [helpCommand]
  }
});
```

### `versionCommand`

The version command definition.

```typescript
import { versionCommand } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  command: {
    commands: [versionCommand]
  }
});
```

## Global Options

### `helpOption`

The help global option definition.

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

The version global option definition.

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

### `showHelp(cli, commandName?)`

Shows help for the CLI or a specific command.

```typescript
import { showHelp } from "cheloni/std";

// Show root help
showHelp(cli);

// Show command help
showHelp(cli, "build");
```

### `showVersion(cliManifest)`

Shows the CLI version.

```typescript
import { showVersion } from "cheloni/std";

showVersion(cli.manifest);
```

### `resolveConfig(cli, explicitPath?)`

Resolves configuration for a CLI instance.

- Reads JSON from global + local config files, plus an optional explicit path.
- Merges them in order: global < local < explicit.

```typescript
import { resolveConfig } from "cheloni/std";

const { config, files } = await resolveConfig(cli);
// config -> merged configuration object (or undefined)
// files  -> [{ path: string, scope: "global" | "local" | "explicit" }, ...]
```

## Utilities

### `mergeOptionsWith(existingOptions, name, schema)`

Merges an option (with schema) into any Zod options schema.

```typescript
import { mergeOptionsWith } from "cheloni/std";
import { z } from "zod";

const options = mergeOptionsWith(
  z.object({
    verbose: z.boolean()
  }),
  "debug",
  z.boolean().optional()
);
```

### `mergeOptionsWithVersion(existingOptions)`

Merges options with version option schema.

```typescript
import { mergeOptionsWithVersion } from "cheloni/std";
import { z } from "zod";

const options = mergeOptionsWithVersion(
  z.object({
    verbose: z.boolean()
  })
);
```

### `getLocalConfigPath(cliName)`

Returns the default local JSON config path `<cwd>/<cli-name>.config.json`.

```typescript
import { getLocalConfigPath } from "cheloni/std";

const path = getLocalConfigPath("my-cli"); // $CWD/my-cli.config.json
```

### `getGlobalConfigPath(cliName)`

Returns the default global JSON config path:

- Unix: `$XDG_CONFIG_HOME/<cli-name>/config.json` or `~/.config/<cli-name>/config.json`
- Windows: `%APPDATA%\\<cli-name>\\config.json` or `<home>\\AppData\\Roaming\\<cli-name>\\config.json`

```typescript
import { getGlobalConfigPath } from "cheloni/std";

const path = getGlobalConfigPath("my-cli");
```

### `loadConfigForCli(cliName, explicitPath?)`

Low‑level helper to read and merge config without a `Cli` instance.

```typescript
import { loadConfigForCli } from "cheloni/std";

const { config, files } = await loadConfigForCli("my-cli", "./my-cli.config.json");
```

## Plugins

### `helpPlugin`

The help plugin that adds help command and `--help` / `-h` global option.

```typescript
import { helpPlugin } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  plugins: [helpPlugin]
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
  plugins: [versionPlugin]
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
      defaultFilename: "sample.config.json",
      defaultConfig: { outputDir: "dist" },
      schema: z.object({ outputDir: z.string() }),
    }),
  ],
});
```

#### Options

- `defaultFilename?: string` - Override the default config filename (defaults to `<cli-name>.config.json`)
- `defaultConfig?: unknown` - Default configuration object; properties not present in the loaded config file will inherit from this
- `schema?: z.ZodTypeAny` - Zod schema to validate the merged configuration

The plugin looks for config files in precedence order (explicit → local → global), uses the first file that exists, merges it with `defaultConfig`, validates against `schema` if provided, and exposes the result on `context.config` and `context.configFiles`.

## Packs

### `basePluginpack`

The standard library pluginpack that includes both `helpPlugin` and `versionPlugin`.

```typescript
import { basePluginpack } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  pluginpacks: [basePluginpack]
});
```

The pluginpack includes both help and version plugins, providing complete help and version support. This is the recommended way to add standard library functionality.
