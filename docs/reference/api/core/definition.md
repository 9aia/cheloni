# Definition API Reference

The Definition layer provides functions to define CLI structure using plain objects and Zod schemas.

## Functions

### `defineCli(definition)`

Creates a CLI definition.

**Parameters:**

- `definition: CliDefinition` - The CLI definition object

**Returns:** `CliDefinition`

**Example (basic):**

```typescript
import { defineCli } from "cheloni";

const cli = defineCli({
  name: "my-cli",
  version: "1.0.0",
  description: "My CLI tool",
});
```

**Example (with plugins and a plugin kit):**

```typescript
import { defineCli, definePlugin } from "cheloni";
import { basicPluginKit } from "cheloni/std/core";

const loggingPlugin = definePlugin({ name: "logging" });

const monitoringKit = [definePlugin({ name: "analytics" }), definePlugin({ name: "tracing" })];

const cli = defineCli({
  name: "my-cli",
  plugins: [loggingPlugin, ...basicPluginKit, ...monitoringKit],
});
```

When you call `createCli()` with this definition, `plugins` is a single list. `onInit` hooks run in **array order**. Reusable bundles are plain arrays (for example `basicPluginKit` from the standard library, or a local `src/plugin-kits/` module you maintain).

**Default metadata from `package.json`:** You can omit `name`, `version`, and/or `description` when you pass `metaUrl: import.meta.url` (from your CLI entry module). `createCli()` walks up from that file’s directory, reads the nearest `package.json`, and fills any of those fields you left out. Values you set on the definition always win. If `name` is still missing after resolution, `createCli()` throws. See [`createCli()`](./creation.md).

### `defineCommand(definition)`

Creates a command definition.

**Parameters:**

- `definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>` - The command definition

**Returns:** `CommandDefinition<TPositionalDefinition, TOptionsDefinition>`

**Example:**

```typescript
import { defineCommand } from "cheloni";
import { z } from "zod";

const command = defineCommand({
  name: "build",
  description: "Build the project",
  options: z.object({
    verbose: z.boolean().optional(),
  }),
  handler: ({ options }) => {
    console.log("Building...", options);
  },
});
```

### `defineRootCommand(definition)`

Creates a root command definition (command without a name).

**Parameters:**

- `definition: RootCommandDefinition<TPositionalDefinition, TOptionsDefinition>` - The root command definition

**Returns:** `CommandDefinition<TPositionalDefinition, TOptionsDefinition>`

**Example:**

```typescript
import { defineRootCommand } from "cheloni";

const rootCommand = defineRootCommand({
  handler: ({ options }) => {
    console.log("Root command");
  },
});
```

### `defineOption(schema)`

Creates an inline option schema for use inside a `z.object()`.

**Parameters:**

- `schema: OptionSchema` - A Zod schema

**Returns:** `OptionSchema`

**Example:**

```typescript
import { defineOption } from "cheloni";
import { z } from "zod";

const force = defineOption(z.boolean().optional());
defineCommand({ options: z.object({ force }) });
```

### `defineOption(definition)` (named option)

Creates a reusable, named option definition that can be passed to `bequeathOptions` so subcommands inherit it automatically.

**Parameters:**

- `definition: OptionDefinition<TSchema>` - The option definition

**Returns:** `OptionDefinition<TSchema>`

**Example:**

```typescript
import { defineOption } from "cheloni";
import { z } from "zod";

const dryRun = defineOption({
  name: "dry-run",
  schema: z.boolean().default(false),
  handler: async ({ value, next }) => {
    if (value) console.log("Dry run mode");
    return next();
  },
});
```

### `definePositional(definition)`

Creates a positional argument definition (typically used as a Zod schema).

**Parameters:**

- `definition: PositionalDefinition` - A Zod schema or `undefined`

**Returns:** `PositionalDefinition`

**Example:**

```typescript
import { definePositional } from "cheloni";
import { z } from "zod";

const positional = definePositional(z.string());
```

### `defineMiddleware(definition)`

Creates a middleware definition.

**Parameters:**

- `definition: MiddlewareDefinition` - The middleware function

**Returns:** `MiddlewareDefinition`

**Example:**

```typescript
import { defineMiddleware } from "cheloni";

const middleware = defineMiddleware(async ({ next }) => {
  const start = Date.now();
  const result = await next();
  console.log("Duration (ms):", Date.now() - start);
  return result;
});
```

### `definePlugin(definition)`

Creates a plugin definition.

**Parameters:**

- `definition: PluginDefinition` - The plugin definition

**Returns:** `PluginDefinition`

**Example:**

```typescript
import { definePlugin } from "cheloni";

const plugin = definePlugin({
  name: "my-plugin",
  onInit: ({ cli }) => {
    console.log("Plugin initialized");
  },
});
```

## Plugin Hooks

### `onInit`

Runs once during CLI creation, before any commands are executed. This is the only hook that can mutate the CLI structure.

**When it runs:** During `createCli()`, for each global plugin in order.

**What you can do:**

- Modify `cli.command` (replace the root command, add bequeathOptions)
- Modify `cli.plugins`
- Access `cli.manifest`

**Error handling:** If `onInit` throws, `createCli()` fails immediately.

**Example:**

```typescript
import { definePlugin, createCommand, createOption, defineOption } from "cheloni";
import z from "zod";

const plugin = definePlugin({
  name: "my-plugin",
  onInit: ({ cli }) => {
    console.log("Plugin initialized");
  },
});
```

### `onBeforeCommandExecution`

Runs after argv is parsed into raw positionals and options, and **before** middleware and schema validation.

**When it runs:** During `executeCommand()`. Global plugins run first, then command plugins.

**What you can do:**

- Access unvalidated `parsedOptions` / `parsedPositionals`
- Access `cli` and the matched `command` definition
- Call `execute({ ctx })` to continue the pipeline and merge values into command `ctx` (same merge rules as middleware `next({ ctx })`). Remaining before-hooks run next, then middleware, validation, and the handler.
- Return without calling `execute` — the pipeline still continues automatically (backward compatible).
- Throw to abort before middleware runs.

**Error handling:** If `onBeforeCommandExecution` throws, middleware and the handler do not run.

**Example:**

```typescript
const authPlugin = definePlugin({
  name: "auth",
  onBeforeCommandExecution: ({ command, cli }) => {
    if (!isAuthenticated() && command.name !== "login") {
      throw new Error("Authentication required");
    }
  },
});
```

**Example (inject context, middleware-style):**

```typescript
const timingPlugin = definePlugin({
  name: "timing",
  onBeforeCommandExecution: async ({ execute }) => {
    await execute({ ctx: { startTime: Date.now() } });
  },
  onAfterCommandExecution: async ({ data }) => {
    const start = data.startTime as number | undefined;
    if (start !== undefined) console.log(Date.now() - start, "ms");
  },
});
```

### `onAfterCommandExecution`

Runs after the handler attempt, in a `finally` block — even if validation or the handler threw.

**When it runs:** During `executeCommand()`, after the try/catch around middleware, validation, and the handler.

**What you can do:**

- Read `data`: merged validated command options layered over accumulated `ctx` (plugin-injected + middleware + bequeath handlers), when those stages completed. If execution failed earlier, `data` is best-effort partial context.
- Cleanup, logging, telemetry

**Error handling:** Errors are logged but don't override the original error.

**Example:**

```typescript
const plugin = definePlugin({
  name: "logging-plugin",
  onAfterCommandExecution: ({ command }) => {
    console.log(`Command ${command.name} completed`);
  },
});
```

### `onDestroy`

Runs when the CLI execution completes, even if an error occurred.

**When it runs:** During `executeCli()`, in a `finally` block.

**What you can do:**

- Cleanup resources
- Close connections
- Final logging

**Error handling:** Errors are logged but don't throw.

**Example:**

```typescript
const plugin = definePlugin({
  name: "db-plugin",
  onDestroy: ({ cli }) => {
    // Close database connections
    db.close();
  },
});
```

## Types

### `CliDefinition`

```typescript
interface CliDefinition {
  name?: string;
  version?: string;
  metaUrl?: string | URL;
  description?: string;
  details?: string;
  deprecated?: boolean | string;
  command?: RootCommandDefinition;
  plugins?: PluginDefinition[];
  onError?: CliErrorHandler;
}
```

`name` is required for a runnable CLI, but it may be omitted on the definition when `metaUrl` is set so `createCli()` can read it from `package.json`. The same applies to `version` and `description`.

### `CommandDefinition<TPositionalDefinition, TOptionsDefinition>`

```typescript
interface CommandDefinition<
  TPositionalDefinition extends PositionalDefinition = any,
  TOptionsDefinition extends OptionSchema = any,
> {
  name: string;
  paths?: string[];
  deprecated?: boolean | string;
  description?: string;
  positional?: TPositionalDefinition;
  options?: TOptionsDefinition;
  middleware?: MiddlewareDefinition[];
  examples?: string[];
  details?: string;
  throwOnExtrageousOptions?: ExtrageousOptionsBehavior;
  plugins?: PluginDefinition[];
  commands?: CommandDefinition[];
  bequeathOptions?: OptionDefinition[];
  handler?: CommandHandler<TPositionalDefinition, TOptionsDefinition>;
}
```

### `RootCommandDefinition<TPositionalDefinition, TOptionsDefinition>`

```typescript
type RootCommandDefinition<
  TPositionalDefinition extends PositionalDefinition = any,
  TOptionsDefinition extends OptionSchema = any,
> = Omit<CommandDefinition<TPositionalDefinition, TOptionsDefinition>, "name">;
```

### `OptionSchema`

```typescript
type OptionSchema = z.ZodTypeAny;
```

### `OptionDefinition<TSchema>`

A reusable, named option that can be shared across commands via `bequeathOptions`.

```typescript
interface OptionDefinition<TSchema extends OptionSchema = OptionSchema> {
  name: string;
  schema?: TSchema;
  handler?: OptionHandler<TSchema>;
}
```

### `PositionalDefinition`

```typescript
type PositionalDefinition = z.ZodTypeAny | undefined;
```

### `MiddlewareDefinition`

```typescript
type MiddlewareDefinition = Middleware;
```

### `PluginDefinition`

```typescript
interface PluginDefinition {
  name: string;
  onInit?: PluginHook;
  onBeforeCommandExecution?: PluginBeforeCommandHook;
  onAfterCommandExecution?: PluginAfterCommandHook;
  onDestroy?: PluginHook;
}
```

### `PluginHook`

Called during CLI initialization (`onInit`) or cleanup (`onDestroy`).

```typescript
type PluginHook = (params: PluginHookParams) => Promisable<void>;
```

**Parameters:**

- `params.cli: Cli` - The CLI instance
- `params.plugin: Plugin` - The plugin instance

### `PluginBeforeCommandHook`

```typescript
type PluginBeforeCommandHook = (params: PluginBeforeCommandHookParams) => Promisable<void>;
```

**Parameters:**

- `params.cli: Cli` - The CLI instance
- `params.plugin: Plugin` - The plugin instance
- `params.command: CommandDefinition` - The command being executed
- `params.parsedOptions` / `params.parsedPositionals` - Raw parse output (unvalidated)
- `params.execute` - `async (opts?: { ctx?: Record<string, unknown> }) => void` — continues remaining before-hooks, then middleware, validation, and handler; merges `ctx` like middleware `next({ ctx })`

### `PluginAfterCommandHook`

```typescript
type PluginAfterCommandHook = (params: PluginAfterCommandHookParams) => Promisable<void>;
```

**Parameters:**

- `params.cli: Cli` - The CLI instance
- `params.plugin: Plugin` - The plugin instance
- `params.command: CommandDefinition` - The command being executed
- `params.data: Record<string, unknown>` - Options merged over accumulated `ctx` when available (see `onAfterCommandExecution` above)

### `ExtrageousOptionsBehavior`

```typescript
type ExtrageousOptionsBehavior = "throw" | "filter-out" | "pass-through";
```

- `'throw'` - Throw an error when extrageous options are found (default)
- `'filter-out'` - Silently remove extrageous options
- `'pass-through'` - Pass extrageous options through to the handler
