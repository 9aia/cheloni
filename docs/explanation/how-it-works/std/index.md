# How Standard Library Works

How the standard library components.

## Concepts

### Short-Circuit Behavior

Global options with handlers (like `--help` and `--version`) short-circuit the execution pipeline. When `executeCommand()` finds a global option present in parsed args with a handler, it calls the handler and **returns immediately** — skipping validation, plugin hooks, and the command handler entirely.

## Plugins

The standard library consists of a small set of focused plugins:

### `helpPlugin`

Uses `onInit` to mutate the CLI structure:
- **No root command exists** — creates one with help command as default handler and injects `help` subcommand
- **Root command exists** — preserves existing definition and appends `help` subcommand

Adds `--help` / `-h` global option that short-circuits to render command-specific help.

### `versionPlugin`

Uses `onInit` to mutate the CLI structure:
- **No root command exists** — creates one (with help as fallback) and injects `version` subcommand, merging `--version` into root options
- **Root command exists** — preserves existing definition, appends `version` subcommand, and merges `--version` into existing options

### `configPlugin`

Registers the std `config` global option on the CLI:

- Adds `--config` / `-c` as a global option
- Lets users point the CLI at an explicit JSON config file

The option handler then:

- Looks for config files in precedence order (explicit → local → global):
  - Checks explicit path if `--config` is provided
  - If not found, checks local (cwd) using `defaultFilename` or `<cli-name>.config.json`
  - If not found, checks global (OS-specific location)
  - Uses the **first file that exists** (no merging between files)
- Merges the matched file config with `defaultConfig`:
  - File config takes precedence over `defaultConfig`
  - If no file exists, uses `defaultConfig` (defaults to `{}`)
- Validates against `schema` if provided
- Exposes the result on the context:
  - `context.config` — merged configuration object (always defined, at least `{}`)
  - `context.configFiles` — list of `{ path, scope }` for the loaded file (scope is `"explicit" | "local" | "global"`)

Note: The plugin does not merge multiple config files. It uses the first file that exists in the precedence order. For merging behavior, use the `resolveConfig` service directly.

## Services

### `helpService`

`showHelp()` dispatches based on whether a command name is provided:
- **Root help** — prints usage, version, description, lists subcommands with paths and deprecation warnings
- **Command help** — searches command tree by name or path, prints usage, aliases, positional, subcommands, options (merged with global options), and examples

Option rendering reads Zod internals for aliases, descriptions, and deprecation flags — the same metadata the manifest layer extracts.

### `versionService`

`showVersion()` reads `cli.manifest.version` and prints it. If no version is set, it throws. The `--version` global option and `version` subcommand both delegate to this function.
