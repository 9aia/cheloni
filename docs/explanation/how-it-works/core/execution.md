# How Execution Works

How command execution works under the hood, step by step.

## Pipeline

```
argv
  │
  ├─ 1. Route ──────────── Match command from the nested command tree
  ├─ 2. Parse ──────────── Extract positional args and options (resolve aliases)
  ├─ 3. Middleware ─────── Run middleware chain, build shared context
  ├─ 4. Validate ───────── Check for unknown options, then Zod-validate positional & options
  ├─ 5. Global options ─── Execute global option handlers (may short-circuit)
  ├─ 6. Plugin hooks ───── onPreCommandExecution (global + command plugins)
  ├─ 7. Handler ────────── Execute command handler with validated params
  └─ 8. Plugin hooks ───── onAfterCommandExecution (always runs, even on error)
```

## Entry Point

`executeCli()` receives `{ cli, args }` (args default to `process.argv.slice(2)`).

1. Shows deprecation warning if CLI is deprecated
2. Resolves the command from the tree
3. Shows deprecation warning if the matched command is deprecated
4. Runs the command pipeline
5. On error: formats and logs via `handleError()`, then `process.exit(1)`
6. **Finally**: runs `onDestroy` plugin hooks (always, even on error)

## Routing

Walks the nested command tree by consuming argv segments:

- Each non-flag arg (`!startsWith('-')`) is matched against command `paths`
- On match: descend into that subcommand, consume the segment
- On no match or flag: stop — current command is the target
- Remaining argv is forwarded to the command as its own args

## Command Pipeline

This is the core of execution. Runs in this exact order:

### 1. Alias Map

Merges command option aliases (from Zod `.meta({ alias })`) with global option aliases into a single lookup map.

### 2. Argument Parsing

Splits raw argv into `{ positional: string[], options: Record<string, any> }` using mri with the alias map.

### 3. Middleware

Runs the middleware array sequentially. All middleware share a single mutable `context` (`Record<string, any>`). Each middleware calls `next()` to advance the chain. The resulting context is forwarded to the handler.

```
middleware[0]({ context, next }) → middleware[1]({ context, next }) → ... → done
                                              ↑ same object
```

### 4. Extraneous Options

Checks parsed options against the schema + global option names. Behavior depends on `throwOnExtrageousOptions`:
- `'throw'` (default): throws `InvalidOptionsError`
- `'filter-out'`: silently drops unknown options
- `'pass-through'`: keeps them for the handler

### 5. Global Option Handlers

Iterates global options. If a global option is present in parsed args:
- Validates its value against its Zod schema
- If it has a handler (e.g. `--help`, `--version`): executes it and **returns early** (short-circuits the rest of the pipeline)

### 6. Positional Validation

Extracts the positional value, shows deprecation warning if applicable, then runs `schema.parse()`. Throws `InvalidPositionalError` on failure.

### 7. Options Validation

Separates valid vs. extra options, shows deprecation warnings, then runs `schema.parse()` on valid options. For `'pass-through'` mode, extra options are merged back into the result.

### 8. Pre-Execution Plugin Hooks

Collects global plugins first, then command-level plugins (created on the fly from definitions). Runs `onPreCommandExecution` hooks in order. If a hook throws, the handler does not execute.

### 9. Handler

Calls the command handler with:
```
{ positional, options, context, command, cli }
```

### 10. Post-Execution Plugin Hooks

Runs `onAfterCommandExecution` in a `finally` block — always executes, even if the handler threw. Hook errors are logged but don't override the original error.

## Error Handling

Errors are handled by `handleError()`, which distinguishes between:

- **Validation errors** (`InvalidPositionalError`, `InvalidOptionsError`): structured Zod issues — each is logged with the field name and description extracted from the manifest
- **Standard errors**: logs the message
- **Unknown errors**: logs a generic message

After logging, `executeCli()` calls `process.exit(1)`.
