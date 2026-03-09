# Definition API Reference

The Definition layer provides functions to define CLI structure using plain objects and Zod schemas.

## Functions

### `defineCli(definition)`

Creates a CLI definition.

**Parameters:**
- `definition: CliDefinition` - The CLI definition object

**Returns:** `CliDefinition`

**Example:**
```typescript
import { defineCli } from "cheloni";

const cli = defineCli({
  name: "my-cli",
  version: "1.0.0",
  description: "My CLI tool"
});
```

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
    verbose: z.boolean().optional()
  }),
  handler: ({ options }) => {
    console.log("Building...", options);
  }
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
  }
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
  handler: ({ value, context }) => {
    console.log('Dry run mode');
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

const middleware = defineMiddleware(async ({ context, next }) => {
  context.startTime = Date.now();
  await next();
  console.log("Duration:", Date.now() - context.startTime);
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
  }
});
```

### `definePluginpack(definition)`

Creates a pluginpack definition that bundles multiple plugins together.

**Parameters:**
- `definition: PluginpackDefinition` - The pluginpack definition

**Returns:** `PluginpackDefinition`

**Example:**
```typescript
import { definePluginpack, definePlugin } from "cheloni";

const pack = definePluginpack({
  name: "my-pack",
  plugins: [plugin1, plugin2]
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
    console.log('Plugin initialized');
  }
});
```

### `onPreCommandExecution`

Runs before a command handler executes, after argument parsing and validation.

**When it runs:** During `executeCommand()`, before the handler runs. Global plugins run first, then command plugins.

**What you can do:**
- Access parsed `command` definition
- Access `cli` instance
- Throw to prevent handler execution

**Error handling:** If `onPreCommandExecution` throws, the handler does not run.

**Example:**
```typescript
const authPlugin = definePlugin({
  name: "auth",
  onPreCommandExecution: ({ command, cli }) => {
    // Check authentication before command runs
    if (!isAuthenticated() && command.name !== "login") {
      throw new Error("Authentication required");
    }
  }
});
```

### `onAfterCommandExecution`

Runs after a command handler executes, even if the handler threw an error.

**When it runs:** During `executeCommand()`, in a `finally` block after the handler.

**What you can do:**
- Cleanup resources
- Log execution results
- Access `command` and `cli`

**Error handling:** Errors are logged but don't override the original error.

**Example:**
```typescript
const plugin = definePlugin({
  name: "logging-plugin",
  onAfterCommandExecution: ({ command }) => {
    console.log(`Command ${command.name} completed`);
  }
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
  }
});
```

## Types

### `CliDefinition`

```typescript
interface CliDefinition {
  name: string;
  version?: string;
  description?: string;
  details?: string;
  deprecated?: boolean | string;
  command?: RootCommandDefinition;
  plugins?: PluginDefinition[];
  pluginpacks?: PluginpackDefinition[];
}
```

### `CommandDefinition<TPositionalDefinition, TOptionsDefinition>`

```typescript
interface CommandDefinition<
  TPositionalDefinition extends PositionalDefinition = any,
  TOptionsDefinition extends OptionSchema = any
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
  TOptionsDefinition extends OptionSchema = any
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
  onPreCommandExecution?: PluginCommandHook;
  onAfterCommandExecution?: PluginCommandHook;
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

### `PluginCommandHook`

Called before (`onPreCommandExecution`) or after (`onAfterCommandExecution`) command execution.

```typescript
type PluginCommandHook = (params: PluginCommandHookParams) => Promisable<void>;
```

**Parameters:**
- `params.cli: Cli` - The CLI instance
- `params.plugin: Plugin` - The plugin instance
- `params.command: CommandDefinition` - The command being executed

### `PackDefinition`

```typescript
interface PluginpackDefinition {
  name: string;
  plugins: PluginDefinition[];
}
```

### `ExtrageousOptionsBehavior`

```typescript
type ExtrageousOptionsBehavior = 'throw' | 'filter-out' | 'pass-through';
```

- `'throw'` - Throw an error when extrageous options are found (default)
- `'filter-out'` - Silently remove extrageous options
- `'pass-through'` - Pass extrageous options through to the handler
