# How Standard Library Works

How the standard library plugins and pack work — what they inject during `onInit` and how help rendering is implemented.

## Plugins

The standard library consists of two plugins:

### `helpPlugin`

Uses `onInit` to mutate the CLI structure:
- **No root command exists** — creates one with help command as default handler and injects `help` subcommand
- **Root command exists** — preserves existing definition and appends `help` subcommand

Adds `--help` / `-h` global option that short-circuits to render command-specific help.

### `versionPlugin`

Uses `onInit` to mutate the CLI structure:
- **No root command exists** — creates one (with help as fallback) and injects `version` subcommand, merging `--version` into root options
- **Root command exists** — preserves existing definition, appends `version` subcommand, and merges `--version` into existing options

### `stdPack`

Includes both `helpPlugin` and `versionPlugin`. Plugins run in order: help plugin creates root if needed, then version plugin adds version support.

## Help Rendering

`showHelp()` dispatches based on whether a command name is provided:
- **Root help** — prints usage, version, description, lists subcommands with paths and deprecation warnings
- **Command help** — searches command tree by name or path, prints usage, aliases, positional, subcommands, options (merged with global options), and examples

Option rendering reads Zod internals for aliases, descriptions, and deprecation flags — the same metadata the manifest layer extracts.

## Short-Circuit Behavior

Global options with handlers (like `--help` and `--version`) short-circuit the execution pipeline. When `executeCommand()` finds a global option present in parsed args with a handler, it calls the handler and **returns immediately** — skipping validation, plugin hooks, and the command handler entirely.

## Version

`showVersion()` reads `cli.manifest.version` and prints it. If no version is set, it throws. The `--version` global option and `version` subcommand both delegate to this function.
