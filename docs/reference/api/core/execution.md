# Execution API Reference

The Execution layer handles command routing, argument parsing, validation, middleware execution, and handler invocation.

## Functions

### `executeCli(options)`

Executes a CLI with the provided arguments. This function:

- Resolves the command from the argument list
- Executes the command
- Handles errors
- Calls `onDestroy` hooks for all plugins

Note: deprecation warnings are typically provided via plugins (e.g. the standard library `deprecationPlugin`).

**Parameters:**

- `options: ExecuteCliOptions` - Execution options

**Returns:** `Promise<void>`

**Example:**

```typescript
import { executeCli } from "cheloni";

await executeCli({
  cli,
  args: process.argv.slice(2), // optional, defaults to process.argv.slice(2)
});
```

### `executeCommand(options)`

Executes a command with the provided arguments. This function:

- Parses arguments
- Executes middleware
- Validates options and positional arguments
- Executes bequeath option handlers
- Calls `onCommandExecution` hooks (each wraps the rest of the chain, then middleware, validation, and the handler)
- Executes the command handler (inside the innermost `execute()`)

Note: plugin hook failures (e.g. `onInit`, `onCommandExecution` before `execute()` completes, `onError` throwing) are wrapped as plugin errors and routed directly to `cli.onError` to avoid error-handler plugin loops. **`return halt()` from `onCommandExecution` is not a failure** — it uses the same `HaltError` path as middleware and ends the command quietly. Failures **after** `await execute()` resolves are routed to `cli.onError` as `PluginAfterCommandExecutionError` without changing a successful command outcome.

**Parameters:**

- `options: ExecuteCommandOptions` - Command execution options

**Returns:** `Promise<void>`

**Example:**

```typescript
import { executeCommand } from "cheloni";

await executeCommand({
  command,
  args: ["--verbose", "file.txt"],
  cli,
});
```

### `parseArgs(args, aliasMap?)`

Parses command-line arguments into positional arguments and options.

**Parameters:**

- `args: string[]` - The argument array
- `aliasMap?: Record<string, string[]>` - Optional alias map

**Returns:** `{ positional: string[], options: Record<string, any> }`

**Example:**

```typescript
import { parseArgs } from "cheloni";

const { positional, options } = parseArgs(["--verbose", "file.txt"], { verbose: ["v"] });
// positional: ["file.txt"]
// options: { verbose: true }
```

### `extractPositionalValue(schema, args, index)`

Extracts a positional value from the argument array at the specified index.

**Parameters:**

- `schema: z.ZodTypeAny | undefined` - The positional schema
- `args: string[]` - The argument array
- `index: number` - The index to extract

**Returns:** `any`

**Example:**

```typescript
import { extractPositionalValue } from "cheloni";
import { z } from "zod";

const value = extractPositionalValue(z.string(), ["file.txt", "other.txt"], 0);
// value: "file.txt"
```

### `handleError(options)`

Handles command execution errors, formatting them appropriately.

**Parameters:**

- `options: { error: unknown, command: Command }` - Error handling options

**Returns:** `void`

**Example:**

```typescript
import { handleError } from "cheloni";

try {
  await executeCommand({ command, args, cli });
} catch (error) {
  handleError({ error, command });
}
```

## Types

### `ExecuteCliOptions`

```typescript
interface ExecuteCliOptions {
  cli: Cli;
  args?: string[];
}
```

### `ExecuteCommandOptions`

```typescript
interface ExecuteCommandOptions {
  args: string[];
  command: Command;
  cli: Cli;
}
```

## Error Classes

### `InvalidSchemaError`

Base class for schema validation errors.

```typescript
class InvalidSchemaError extends Error {
  readonly issues: ReadonlyArray<z.core.$ZodIssue>;

  constructor(message: string, issues: ReadonlyArray<z.core.$ZodIssue>);
}
```

### `InvalidOptionsError`

Thrown when options validation fails.

```typescript
class InvalidOptionsError extends InvalidSchemaError {
  constructor(message: string, issues: ReadonlyArray<z.core.$ZodIssue>);
}
```

### `InvalidOptionError`

Thrown when a single option validation fails.

```typescript
class InvalidOptionError extends InvalidSchemaError {
  constructor(message: string, issues: ReadonlyArray<z.core.$ZodIssue>);
}
```

### `InvalidPositionalError`

Thrown when positional argument validation fails.

```typescript
class InvalidPositionalError extends InvalidSchemaError {
  constructor(message: string, issues: ReadonlyArray<z.core.$ZodIssue>);
}
```

## Execution Flow

1. **Argument Parsing** - Parse raw arguments into positional and options (alias map applied first)
2. **Plugin `onCommandExecution` chain** - Global then command plugins (same registration order as before). Each hook receives unvalidated `parsedOptions` / `parsedPositionals` and must **return** `await execute({ ctx })` or `halt()` — same merge semantics as middleware `next({ ctx })`, same stop semantics as middleware `halt()`. The innermost `execute` runs middleware through handler.
3. **Middleware Execution** - Execute the **matched command’s** middleware chain only; starts from plugin-merged `ctx`; context from `next({ ctx })` is merged
4. **Extraneous Options** - Enforce `throwOnExtrageousOptions` policy against the command schema and bequeath names
5. **Bequeath Option Handlers** - Execute bequeath option handlers when flags are present (may short-circuit)
6. **Positional Validation** - Extract and validate positional arguments with Zod
7. **Option Schema Validation** - Validate command options with Zod
8. **Handler Execution** - Execute the command handler

## Hook Execution Order

`onCommandExecution` runs once per invocation, immediately after parse. Outer plugins wrap inner ones: the first registered global plugin’s hook runs first and calls `execute`, which enters the next plugin, and so on, until the core pipeline (middleware → validation → handler) runs inside the innermost `execute`. Code **after** each `await execute()` unwinds in reverse order (inner plugin teardown runs before outer). Use `try` / `finally` inside a hook when teardown must run even if `execute()` rejects.

Plugins run in the same order as before: **global** plugins (from `cli.plugins`, in registration order), then **command-level** plugins from the matched command’s definition (in definition order).
