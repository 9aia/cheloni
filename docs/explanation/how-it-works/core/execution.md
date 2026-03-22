# How Execution Works

How command execution works under the hood, step by step.

## Pipeline

```
argv
  │
  ├─ 1. Route ──────────── Match command from the nested command tree
  ├─ 2. Parse ──────────── Extract positional args and options (resolve aliases)
  ├─ 3. Plugin (pre) ────── onBeforeCommandExecution (global + command plugins; raw parsed args)
  ├─ 4. Middleware ─────── Matched command only; build ctx via next()
  ├─ 5. Validate ───────── Unknown-option policy, bequeath handlers, Zod positional & options
  ├─ 6. Handler ────────── Execute command handler with validated params
  └─ 7. Plugin (post) ──── onAfterCommandExecution (always runs, even on error)
```

## Entry Point

`executeCli()` receives `{ cli, args }` (args default to `process.argv.slice(2)`).

1. Resolves the command from the tree
2. Runs the command pipeline
3. On error: formats and logs via `handleError()`, then `process.exit(1)`
4. **Finally**: runs `onDestroy` plugin hooks (always, even on error)

Deprecation warnings are not emitted by the core execution layer. If you install the standard library `deprecationPlugin`, it will emit warnings via plugin hooks (e.g. `onInit` for the CLI and `onBeforeCommandExecution` for the matched command).

## Routing

Walks the nested command tree by consuming argv segments:

- Each non-flag arg (`!startsWith('-')`) is matched against command `paths`
- On match: descend into that subcommand, consume the segment
- On no match or flag: stop — current command is the target
- Remaining argv is forwarded to the command as its own args

## Command Pipeline

This is the core of execution. Runs in this exact order:

### 1. Alias Map

Merges command option aliases (from Zod `.meta({ aliases })`) with bequeath option aliases into a single lookup map.

### 2. Argument Parsing

Splits raw argv into `{ positional: string[], options: Record<string, any> }` using mri with the alias map.

### 3. Pre-Execution Plugin Hooks

Runs `onBeforeCommandExecution` for global plugins, then command plugins, in order. Hooks receive **unvalidated** `parsedOptions` and `parsedPositionals`, plus `execute({ ctx })`. Calling `execute` continues with the **next** before-hooks, then middleware, validation, and the handler, merging `ctx` the same way as middleware `next({ ctx })` (via defu). If a hook returns without calling `execute`, the pipeline still advances (backward compatible). If a hook throws, the rest of the pipeline does not run.

### 4. Middleware

Runs the **matched command’s** `middleware` array only (not parent commands’ arrays), in order. Each step receives frozen params `{ ctx, next, cli, command, halt }`. The initial `ctx` includes any values merged from pre-hooks via `execute({ ctx })`. Context grows when a middleware **returns** `next({ ctx: { ... } })` (deep-merge via defu). Each middleware must **return** the result of `next()`. The final context is passed to bequeath option handlers and the command handler as `ctx`.

### 5. Extraneous Options

Checks parsed options against the schema + bequeath option names. Behavior depends on `throwOnExtrageousOptions`:

- `'throw'` (default): throws `InvalidOptionsError`
- `'filter-out'`: silently drops unknown options
- `'pass-through'`: keeps them for the handler

### 6. Bequeath Option Handlers

Iterates bequeath options. If a bequeath option is present in parsed args:

- Validates its value against its Zod schema
- If it has a handler (e.g. `--help`, `--version`): executes it and **returns early** (short-circuits the rest of the pipeline)

### 7. Positional Validation

Extracts the positional value, then runs `schema.parse()`. Throws `InvalidPositionalError` on failure.

### 8. Options Validation

Separates valid vs. extra options, then runs `schema.parse()` on valid options. For `'pass-through'` mode, extra options are merged back into the result.

### 9. Handler

Calls the command handler with:

```
{ positional, options, ctx, command, cli }
```

### 10. Post-Execution Plugin Hooks

Runs `onAfterCommandExecution` in a `finally` block — always executes, even if the handler threw. Hooks receive `data`: validated command options merged over accumulated `ctx` when those stages completed (otherwise best-effort partial context). Hook errors are logged but don't override the original error.

## Error Handling

Errors are handled by `handleError()`, which distinguishes between:

- **Validation errors** (`InvalidPositionalError`, `InvalidOptionsError`): structured Zod issues — each is logged with the field name and description extracted from the manifest
- **Standard errors**: logs the message
- **Unknown errors**: logs a generic message

After logging, `executeCli()` calls `process.exit(1)`.
