# How Standard Library Works

How the standard library components.

## Concepts

### Short-Circuit Behavior

Options with handlers (like `--help` and `--version`) short-circuit the execution pipeline. When `executeCommand()` finds a option present in parsed args with a handler, it calls the handler and **returns immediately** — skipping validation, plugin hooks, and the command handler entirely.

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
  - Uses `c12.loadConfig` rules (with options from `c12Options`)
- Validates against `schema` if provided (via `validateConfig()`); on failure it throws a `ConfigValidationError` with the original Zod error attached as `cause`
- Injects the (validated) result into the middleware chain via `configMiddleware`:
  - `ctx.config` — merged configuration object (always defined, at least `{}`)
  - `ctx.configFile` — the resolved main config file (when available)

Note: config merging is handled by `c12`. For full control, pass more options through `c12Options` or call `loadConfig` from `c12` directly.

## Services

### `helpService`

`showHelp()` dispatches based on whether a command name is provided:

- **Root help** — prints usage, version, description, lists subcommands with paths and deprecation warnings
- **Command help** — searches command tree by name or path, prints usage, aliases, positional, subcommands, options (merged with bequeath options), and examples

Option rendering reads Zod internals for aliases, descriptions, and deprecation flags — the same metadata the manifest layer extracts.

### `deprecationService`

The std deprecation service emits warnings for deprecated CLIs, commands, options, and positional arguments. It is typically used via `deprecationPlugin` or `basicPluginKit`.

See: `docs/guides/std/deprecation.md`.

### `versionService`

`showVersion()` reads `cli.manifest.version` and prints it. If no version is set, it throws. The `--version` global option and `version` subcommand both delegate to this function.
