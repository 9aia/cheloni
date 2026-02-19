# How Definition Works

How the definition layer works — identity functions, type inference, and Zod integration.

## Identity Functions

The `define*` functions are identity functions. They return the exact same object they receive. Their only purpose is to provide type inference so the user gets autocomplete and type-checking without manual annotations.

```
defineCommand({ ... }) → same object, but now TypeScript knows its shape
```

This means definitions are plain objects with no hidden state, no classes, no prototype chains. They can be composed, spread, and passed around freely.

## Type Generics

`CommandDefinition` carries two type parameters: `TPositionalDefinition` and `TOptionsDefinition`. These capture the exact Zod schema types the user provides:

```
defineCommand({
  positional: z.string(),            → TPositionalDefinition = z.ZodString
  options: z.object({ v: z.boolean() }) → TOptionsDefinition = z.ZodObject<{ v: z.ZodBoolean }>
})
```

These generics propagate through creation and into the handler, where `z.infer<T>` extracts the runtime types. The handler receives `positional: string` and `options: { v: boolean }` without any manual typing.

## Root Commands

`RootCommandDefinition` is `CommandDefinition` with `name` omitted. `defineRootCommand()` adds `name: "root"` automatically, so the user never needs to name the root.

## Zod as the Schema Layer

Positional and options are raw Zod schemas — not wrappers, not adapters. The definition stores the schema directly, and downstream layers (`manifest`, `creation`, `execution`) read from it. This is what makes the entire type inference chain work: the Zod type is the single source of truth from definition to handler.

Metadata like `description`, `aliases`, and `deprecated` is embedded in the schema via `.meta()` or `.describe()`, and later extracted by the manifest layer through Zod's `_def` internals.
