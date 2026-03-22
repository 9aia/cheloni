# How Creation Works

How definitions are turned into runtime objects and how plugin `onInit` hooks run.

## Runtime Objects

Each definition type produces a runtime object that wraps the original definition alongside its extracted manifest:

```
CliDefinition       → Cli       { manifest, command, plugins }
CommandDefinition   → Command   { definition, manifest, commands, paths, bequeathOptions }
PluginDefinition    → Plugin    { definition, manifest }
OptionDefinition    → Option    { definition, manifest }
```

## CLI Creation

`createCli()` is the main orchestrator. It runs in this order:

1. When `metaUrl` is set and any of `name`, `version`, or `description` are omitted, reads the nearest `package.json` (walking up from that module’s directory) and fills those fields
2. Extracts the CLI manifest via `getCliManifest()`
3. Creates the root command tree (if a command definition is provided), including bequeath options
4. Creates plugins from `plugins` (in array order)
5. Assembles the `Cli` object
6. Runs `onInit` hooks for each plugin, passing the `Cli` object

If any `onInit` hook throws, creation fails immediately — the error is logged and re-thrown.

## Command Tree

`createCommand()` builds the command tree recursively. For each command definition:

1. Reads `commands`
2. Calls `createCommand()` for each child definition
3. Stores children in a `ManifestKeyedMap` keyed by `manifest.name`
4. Extracts the command manifest via `getCommandManifest()`
5. Resolves `paths` — defaults to `[definition.name]` if none provided

`createRootCommand()` is a thin wrapper that adds `name: "__root__"` and delegates to `createCommand()`.

## `ManifestKeyedMap`

Collections of commands, plugins, and bequeath options use `ManifestKeyedMap` — a `Map`-backed collection that derives the key from each item via its `manifest.name` property. It provides:

- Uniqueness enforcement — adding a duplicate key overwrites the previous value
- Key-based lookup via `.get(key)`
- Iteration via `.values()` or `for...of`
- Convenient `.set(value)` method that automatically uses `value.manifest.name` as the key

This is what allows `cli.plugins`, `command.bequeathOptions`, and `command.commands` to be both iterable and key-addressable.

## Plugin `onInit` Mutation

After the `Cli` object is assembled, `onInit` hooks run in insertion order. Hooks receive `{ cli, plugin }` and can mutate the CLI directly:

- Replace `cli.command` with a new command tree
- Add items to `command.bequeathOptions`
- Modify `cli.plugins`

The standard library plugins use this to inject `help` and `version` commands and global options. See [Creating Plugins](../../../guides/advanced/creating-plugins.md).
