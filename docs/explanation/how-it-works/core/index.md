# How Core Works

Core structure and data flow.

## Layers

Cheloni has four layers, each transforming the output of the previous one:

```
Definition (plain objects with Zod schemas)
    ↓ extract metadata
Manifest (serializable metadata for help/introspection)
    ↓ build runtime objects
Creation (runtime instances with definition + manifest)
    ↓ resolve, parse, validate, run
Execution (command pipeline)
```

- [How Definition Works](./definition.md) - Identity functions, type generics, Zod as the schema layer
- [How Manifest Works](./manifest.md) - Metadata extraction from Zod internals, recursive traversal
- [How Creation Works](./creation.md) - Runtime object construction, command tree, `ManifestKeyedMap`, plugin `onInit`
- [How Execution Works](./execution.md) - Routing, parsing, middleware, validation, handler pipeline

## Type Inference

Types flow from Zod schemas through all layers:

1. **Definition** — the user provides a Zod schema (e.g. `z.object({ verbose: z.boolean() })`) as `options`. `CommandDefinition<TPositional, TOptions>` captures the exact Zod types as generics.
2. **Creation** — the generics are preserved on the `Command` runtime object.
3. **Execution** — `CommandHandlerParams` uses `z.infer<T>` on the definition generics to produce the runtime types. The handler receives `options: { verbose: boolean }` without any manual annotation.

## File Structure

```
core/
├── definition/     # Plain objects with Zod schemas
├── manifest/       # Metadata extraction from definitions
├── creation/       # Runtime object construction + plugin onInit
└── execution/      # Routing, parsing, validation, handler pipeline
```
