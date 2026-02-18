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
    command: [helpCommand]
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
    command: [versionCommand]
  }
});
```

## Global Options

### `helpOption`

The help global option definition.

```typescript
import { createGlobalOption } from "cheloni";
import { helpOption } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  globalOption: helpOption
});
```

### `versionOption`

The version global option definition.

```typescript
import { createGlobalOption } from "cheloni";
import { versionOption } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  globalOption: versionOption
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

## Plugins

### `helpPlugin`

The help plugin that adds help command and `--help` / `-h` global option.

```typescript
import { helpPlugin } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  plugin: helpPlugin
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
  plugin: versionPlugin
});
```

The plugin's `onInit` hook automatically adds the `version` command and merges `--version` / `-v` into root options. If no root command exists, it creates one.

## Packs

### `stdPack`

The standard library pack that includes both `helpPlugin` and `versionPlugin`.

```typescript
import { stdPack } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  pack: stdPack
});
```

The pack includes both help and version plugins, providing complete help and version support. This is the recommended way to add standard library functionality.
