# Help

Add help command and `--help` / `-h` global option to your CLI.

## Using the Plugin

```typescript
import { helpPlugin } from 'cheloni/std';

const cli = await createCli({
  name: 'my-cli',
  version: '1.0.0',
  plugins: [helpPlugin],
});
```

## What It Adds

- `help` command — shows root help or help for a specific command
- `--help` / `-h` global option — shows help for the current command (short-circuits execution)

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

## Using the Base Pluginpack

For most CLIs, use `basePluginpack` which includes both help and version:

```typescript
import { basePluginpack } from 'cheloni/std';

const cli = await createCli({
  name: 'my-cli',
  version: '1.0.0',
  pluginpacks: [basePluginpack],
});
```
