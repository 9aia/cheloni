# Version

Add version command and `--version` / `-v` global option to your CLI.

## Using the Plugin

```typescript
import { versionPlugin } from 'cheloni/std';

const cli = await createCli({
  name: 'my-cli',
  version: '1.0.0',
  plugins: [versionPlugin],
});
```

## What It Adds

- `version` command — prints the CLI version
- `--version` / `-v` global option — prints version (short-circuits execution)

## Behavior

- **No root command exists** — creates one (with help as fallback) and injects `version` subcommand, merging `--version` into root options
- **Root command exists** — preserves existing definition, appends `version` subcommand, and merges `--version` into existing options

## Usage

```bash
# Show version via command
$ my-cli version

# Show version via option
$ my-cli --version
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
