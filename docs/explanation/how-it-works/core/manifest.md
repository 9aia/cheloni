# How Manifest Works

How metadata is extracted from definitions for help generation and introspection.

## What the Manifest Contains

Each definition type has a corresponding manifest interface that holds only serializable metadata — no Zod schemas, no handlers, no runtime logic.

- **CLI**: name, version, description, details, deprecated, plus nested command/option/plugin manifests
- **Command**: name, paths, description, details, example, deprecated, plus nested positional/options/plugins/subcommand manifests
- **Option**: name, description, details, aliases, deprecated
- **Positional**: description, details, deprecated
- **Plugin**: name

## Zod Internals

Cheloni reads metadata directly from Zod's internal `_def` property. The helper functions in `lib/zod.ts` handle the extraction:

- **`getSchemaObject(schema)`** — unwraps a Zod object to get its `shape` (the `{ key: ZodType }` map). Tries `_def.shape` first, falls back to `schema.shape`.
- **`getSchemaDescription(schema)`** — reads `_def.description` or `_def.metadata.description`
- **`getSchemaAliases(schema)`** — reads `_def.metadata.aliases` (string array)
- **`getSchemaDeprecated(schema)`** — reads `_def.deprecated` or `_def.metadata.deprecated` (boolean or string)

These are the same internals that Zod populates when the user calls `.describe()`, `.meta()`, or `.deprecated()`.

## Recursive Extraction

Manifest extraction is recursive. `getCliManifest()` calls `getCommandManifest()` for the root command, which in turn calls itself for each nested subcommand, and calls `getOptionsManifest()` / `getPositionalManifest()` for its schemas.

```
getCliManifest()
  ├─ getCommandManifest(rootCommand)
  │   ├─ getPositionalManifest()
  │   ├─ getOptionsManifest()
  │   │   └─ getOptionManifest() per field in the Zod object shape
  │   ├─ getPluginsManifest()
  │   └─ getCommandManifest() per subcommand (recursive)
  ├─ getOptionManifest() per global option
  └─ getPluginManifest() per plugin
```

## When It Runs

Manifest extraction happens at two points:

1. **During creation** — `createCli()` calls `getCliManifest()` to build the top-level manifest. `createCommand()` calls `getCommandManifest()` for each command. The extracted manifests are stored on the runtime objects (`cli.manifest`, `command.manifest`).
2. **During error handling** — `handleError()` calls `getOptionsManifest()` and `getPositionalManifest()` to enrich validation error messages with field descriptions from the schema.

The manifest is a snapshot. If plugins mutate the CLI structure during `onInit`, the manifest on `cli.manifest` reflects the state *before* those mutations (it's extracted first). Individual command manifests created after mutation will reflect the updated structure.
