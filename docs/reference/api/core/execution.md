# Execution API Reference

The Execution layer handles command routing, argument parsing, validation, middleware execution, and handler invocation.

## Functions

### `executeCli(options)`

Executes a CLI with the provided arguments. This function:
- Resolves the command from the argument list
- Shows deprecation warnings if needed
- Executes the command
- Handles errors
- Calls `onDestroy` hooks for all plugins

**Parameters:**
- `options: ExecuteCliOptions` - Execution options

**Returns:** `Promise<void>`

**Example:**
```typescript
import { executeCli } from "cheloni";

await executeCli({
  cli,
  args: process.argv.slice(2) // optional, defaults to process.argv.slice(2)
});
```

### `executeCommand(options)`

Executes a command with the provided arguments. This function:
- Parses arguments
- Executes middleware
- Validates options and positional arguments
- Executes global option handlers
- Calls `onPreCommandExecution` hooks
- Executes the command handler
- Calls `onAfterCommandExecution` hooks

**Parameters:**
- `options: ExecuteCommandOptions` - Command execution options

**Returns:** `Promise<void>`

**Example:**
```typescript
import { executeCommand } from "cheloni";

await executeCommand({
  command,
  args: ["--verbose", "file.txt"],
  cli
});
```

### `parseArgs(args, aliasMap?)`

Parses command-line arguments into positional arguments and options.

**Parameters:**
- `args: string[]` - The argument array
- `aliasMap?: Record<string, string | string[]>` - Optional alias map

**Returns:** `{ positional: string[], options: Record<string, any> }`

**Example:**
```typescript
import { parseArgs } from "cheloni";

const { positional, options } = parseArgs(
  ["--verbose", "file.txt"],
  { v: "verbose" }
);
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

const value = extractPositionalValue(
  z.string(),
  ["file.txt", "other.txt"],
  0
);
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

1. **Argument Parsing** - Parse raw arguments into positional and options
2. **Middleware Execution** - Execute middleware chain, building context
3. **Option Validation** - Validate options against schema and check for extrageous options
4. **Global Option Handlers** - Execute global option handlers (may short-circuit)
5. **Positional Validation** - Extract and validate positional arguments
6. **Option Schema Validation** - Validate options with Zod
7. **Plugin Hooks (Pre)** - Call `onPreCommandExecution` hooks
8. **Handler Execution** - Execute the command handler
9. **Plugin Hooks (Post)** - Call `onAfterCommandExecution` hooks (always runs, even on error)

## Hook Execution Order

During command execution:

1. Global plugins' `onPreCommandExecution` (in registration order)
2. Command plugins' `onPreCommandExecution` (in registration order)
3. Command handler
4. Command plugins' `onAfterCommandExecution` (reverse order)
5. Global plugins' `onAfterCommandExecution` (reverse order)
