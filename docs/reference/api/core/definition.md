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

### `defineOption(definition)`

Creates an option definition (typically used as a Zod schema).

**Parameters:**
- `definition: OptionDefinition` - A Zod schema or `undefined`

**Returns:** `OptionDefinition`

**Example:**
```typescript
import { defineOption } from "cheloni";
import { z } from "zod";

const options = defineOption(
  z.object({
    verbose: z.boolean(),
    output: z.string()
  })
);
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

### `defineGlobalOption(definition)`

Creates a global option definition available to all commands.

**Parameters:**
- `definition: GlobalOptionDefinition<TSchema>` - The global option definition

**Returns:** `GlobalOptionDefinition<TSchema>`

**Example:**
```typescript
import { defineGlobalOption } from "cheloni";
import { z } from "zod";

const globalOption = defineGlobalOption({
  name: "config",
  schema: z.string().optional(),
  handler: ({ value }) => {
    console.log("Config:", value);
  }
});
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

### `definePack(definition)`

Creates a pack definition that bundles multiple plugins together.

**Parameters:**
- `definition: PackDefinition` - The pack definition

**Returns:** `PackDefinition`

**Example:**
```typescript
import { definePack, definePlugin } from "cheloni";

const pack = definePack({
  name: "my-pack",
  plugin: [plugin1, plugin2]
});
```

## Plugin Hooks

### `onInit`

Runs once during CLI creation, before any commands are executed. This is the only hook that can mutate the CLI structure.

**When it runs:** During `createCli()`, for each global plugin in order.

**What you can do:**
- Modify `cli.command` (replace the root command)
- Add to `cli.globalOptions`
- Modify `cli.plugins`
- Access `cli.manifest`

**Error handling:** If `onInit` throws, `createCli()` fails immediately.

**Example:**
```typescript
import { definePlugin, createCommand, createGlobalOption } from "cheloni";
import z from "zod";

const plugin = definePlugin({
  name: "my-plugin",
  onInit: ({ cli }) => {
    // Add a global option
    cli.globalOptions.add(
      createGlobalOption({
        name: "debug",
        schema: z.boolean().optional()
      })
    );
    
    // Modify the root command
    if (cli.command) {
      cli.command = createCommand({
        ...cli.command.definition,
        // ... modifications
      });
    }
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
  globalOption?: MaybeArray<GlobalOptionDefinition>;
  plugin?: MaybeArray<PluginDefinition>;
  pack?: MaybeArray<PackDefinition>;
}
```

### `CommandDefinition<TPositionalDefinition, TOptionsDefinition>`

```typescript
interface CommandDefinition<
  TPositionalDefinition extends PositionalDefinition = any,
  TOptionsDefinition extends OptionDefinition = any
> {
  name: string;
  paths?: string[];
  deprecated?: boolean | string;
  description?: string;
  positional?: TPositionalDefinition;
  options?: TOptionsDefinition;
  middleware?: MaybeArray<MiddlewareDefinition>;
  example?: MaybeArray<string>;
  details?: string;
  throwOnExtrageousOptions?: ExtrageousOptionsBehavior;
  plugin?: MaybeArray<PluginDefinition>;
  command?: MaybeArray<CommandDefinition>;
  handler?: CommandHandler<TPositionalDefinition, TOptionsDefinition>;
}
```

### `RootCommandDefinition<TPositionalDefinition, TOptionsDefinition>`

```typescript
type RootCommandDefinition<
  TPositionalDefinition extends PositionalDefinition = any,
  TOptionsDefinition extends OptionDefinition = any
> = Omit<CommandDefinition<TPositionalDefinition, TOptionsDefinition>, "name">;
```

### `OptionDefinition`

```typescript
type OptionDefinition = z.ZodTypeAny | undefined;
```

### `PositionalDefinition`

```typescript
type PositionalDefinition = z.ZodTypeAny | undefined;
```

### `GlobalOptionDefinition<TSchema>`

```typescript
interface GlobalOptionDefinition<TSchema extends z.ZodTypeAny = any> {
  name: string;
  schema?: TSchema;
  handler?: OptionHandler<TSchema>;
}
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
type PluginHook = (params: PluginHookParams) => MaybePromise<void>;
```

**Parameters:**
- `params.cli: Cli` - The CLI instance
- `params.plugin: Plugin` - The plugin instance

### `PluginCommandHook`

Called before (`onPreCommandExecution`) or after (`onAfterCommandExecution`) command execution.

```typescript
type PluginCommandHook = (params: PluginCommandHookParams) => MaybePromise<void>;
```

**Parameters:**
- `params.cli: Cli` - The CLI instance
- `params.plugin: Plugin` - The plugin instance
- `params.command: CommandDefinition` - The command being executed

### `PackDefinition`

```typescript
interface PackDefinition {
  name: string;
  plugin: MaybeArray<PluginDefinition>;
}
```

### `ExtrageousOptionsBehavior`

```typescript
type ExtrageousOptionsBehavior = 'throw' | 'filter-out' | 'pass-through';
```

- `'throw'` - Throw an error when extrageous options are found (default)
- `'filter-out'` - Silently remove extrageous options
- `'pass-through'` - Pass extrageous options through to the handler
