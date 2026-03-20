## Cheloni CLI for Framework Users (Proposal)

Cheloni is a framework: you use it to build CLIs (typed commands + validated args/options), and you use its top-level CLI to scaffold and generate code.

### What you run as a developer
- `cheloni init`: scaffold a new cheloni project (prompts for project name/description/template)
- `cheloni generate ...`: generate code artifacts (commands, plugins, options, etc.)
- Your generated/defined CLI app provides `help`, `version`, and standard cross-cutting flags (like verbosity, config, dry-run) when the std pluginpack is used

### User-facing runtime commands & flags (what end users see)
- `help [command]`: `cli help` shows the command list; `cli help <command>` shows usage, positional/options, subcommands, and examples
- `version`
- `cli version` shows the CLI version; also supported via std `--version/-v` option
- `--help/-h`: show help (and halt)
- `--verbose/-V`: increase verbosity (and set up a logger)
- `--dry-run/-n`: simulate without side effects
- `--config/-c`: load config and inject it into command execution context

### How the framework user defines their CLI (minimal concepts)
- You define a command tree where commands can be nested (subcommands).
- Each command can declare a `positional` schema (validated input passed to the handler) and/or an `options` schema (named flags validated before execution).
- You attach a `handler` (runs after validation) and optionally middleware to enrich the execution context.

### Extensibility: plugins and pluginpacks (framework-level)
- Plugins can add/modify commands and options during `onInit` (before commands run).
- Plugins can hook execution to run logic before/after commands and to format/handle errors when validation or execution fails.
- Std pluginpack (the typical default) bundles common developer-experience behavior like help/version/deprecation warnings.

### Planned generation surface (for `cheloni generate`)
- `command`: generate a new command module + wiring
- `plugin`: generate a new plugin module
- `option`: generate a new option schema + handler
- `positional`: generate a new positional schema
- `plugin-kit`: generate a named plugin pack (bundle of plugins)
