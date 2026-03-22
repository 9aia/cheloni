# Help

Add help command and `--help` / `-h` option to your CLI.

## Using the Plugin

```typescript
import { helpPlugin } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  plugins: [helpPlugin],
});
```

## What It Adds

- `help` command — shows root help or help for a specific command
- `--help` / `-h` option — shows help for the current command (short-circuits execution)

## Behavior

- **No root command exists** — creates one with help as the default handler and injects `help` subcommand
- **Root command exists** — preserves existing definition and appends `help` subcommand

## Usage

```bash
# Show root help
$ my-cli help

# Show command help
$ my-cli help deploy
$ my-cli deploy --help
```

## Using `basicPluginKit`

For most CLIs, spread `basicPluginKit` from `cheloni/std/core` (deprecation, help, version, and default error handling):

```typescript
import { basicPluginKit } from "cheloni/std/core";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  plugins: [...basicPluginKit],
});
```
