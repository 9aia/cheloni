# How Creation Works

How definitions are turned into runtime objects and how plugin `onInit` hooks run.

## Runtime Objects

Each definition type produces a runtime object that wraps the original definition alongside its extracted manifest:

```
CliDefinition       → Cli       { manifest, command, plugins, globalOptions }
CommandDefinition   → Command   { definition, manifest, commands, paths, deprecated }
PluginDefinition    → Plugin    { definition, manifest }
GlobalOptionDef     → GlobalOption { definition, manifest }
```

## CLI Creation

`createCli()` is the main orchestrator. It runs in this order:

1. Extracts the CLI manifest via `getCliManifest()`
2. Creates the root command tree (if a command definition is provided)
3. Creates global options from definitions (normalized from `MaybeArray` to array)
4. Creates plugins from definitions (normalized the same way)
5. Assembles the `Cli` object
6. Runs `onInit` hooks for each plugin, passing the `Cli` object

If any `onInit` hook throws, creation fails immediately — the error is logged and re-thrown.

## Command Tree

`createCommand()` builds the command tree recursively. For each command definition:

1. Normalizes the `command` field (single or array) into an array
2. Calls `createCommand()` for each child definition
3. Stores children in a `KeyedSet` keyed by `manifest.name`
4. Extracts the command manifest via `getCommandManifest()`
5. Resolves `paths` — defaults to `[definition.name]` if none provided

`createRootCommand()` is a thin wrapper that adds `name: "root"` and delegates to `createCommand()`.

## `KeyedSet`

Collections of commands, plugins, and global options use `KeyedSet` — a `Map`-backed set that derives the key from each item via a function (e.g. `plugin => plugin.manifest.name`). It provides:

- Uniqueness enforcement — adding a duplicate key throws by default
- Key-based lookup via `.get(key)`
- Iteration via `for...of`

This is what allows `cli.plugins`, `cli.globalOptions`, and `command.commands` to be both iterable and key-addressable.

## Plugin `onInit` Mutation

After the `Cli` object is assembled, `onInit` hooks run in insertion order. Hooks receive `{ cli, plugin }` and can mutate the CLI directly:

- Replace `cli.command` with a new command tree
- Add items to `cli.globalOptions`
- Modify `cli.plugins`

The standard library plugins use this to inject `help` and `version` commands and global options. See [Creating Plugins](../../../guides/advanced/creating-plugins.md).
