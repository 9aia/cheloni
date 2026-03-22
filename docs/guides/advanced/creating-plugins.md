# Creating Plugins

Plugins extend CLI functionality with lifecycle hooks. Use them for analytics, telemetry, logging, or modifying CLI structure at runtime.

## Basic Structure

```typescript
import { definePlugin } from "cheloni";

export interface MyPluginConfig {
  level?: "info" | "debug";
}

const myPlugin = definePlugin((options: MyPluginConfig = {}) => ({
  name: "my-plugin",
  onInit: async ({ cli, plugin }) => {
    // Called when CLI is created
  },
  onCommandExecution: async ({ cli, plugin, command, execute }) => {
    if (options.level === "debug") {
      console.debug("About to run", command.name);
    }
    const ctx = await execute();
    // Teardown / logging after the handler (use try/finally if this must run when execute rejects)
    return ctx;
  },
  onDestroy: async ({ cli, plugin }) => {
    // Called when CLI is shutting down
  },
}));
```

## Injecting context with `execute()` and stopping with `halt()`

`onCommandExecution` receives `execute` and `halt`, like middleware `next` / `halt`. **Return** `await execute({ ctx: { ... } })` to run the remaining plugin hooks, then middleware, validation, and the handler. Merged fields become part of command `ctx` (same `defu` rules as `next({ ctx })`). **Return** `halt()` to stop the command cleanly with no error.

If you neither return `execute(...)` nor `halt()`, Cheloni throws `PluginCommandExecutionError`.

`await execute()` resolves to the post-attempt context snapshot — validated options merged over accumulated command `ctx` when those stages ran — so you can combine injected values (for example `startTime`) with parsed flags in the same hook.

See the [benchmark example](../../examples/03-benchmark.md) (`src/plugins/time.ts`).

## Lifecycle Hooks

### `onInit`

Runs once when the CLI is created, before any commands execute. Use it to:

- Modify CLI structure (add commands, options)
- Initialize services
- Set up configuration

```typescript
import { createOption, defineOption } from "cheloni";
import z from "zod";

const plugin = definePlugin({
  name: "my-plugin",
  onInit: async ({ cli }) => {
    console.log("CLI initialized");
  },
});
```

### `onCommandExecution`

Runs around each command (after parse, before middleware in the innermost `execute`). Use it for:

- Authentication checks before `await execute()`
- Logging and performance tracking (`const ctx = await execute(...)` then log)
- Cleanup with `try` / `finally` when `execute()` may reject

```typescript
onCommandExecution: async ({ cli, command, execute }) => {
  console.log(`Executing: ${command.name}`);
  try {
    return await execute();
  } finally {
    console.log(`Finished: ${command.name}`);
  }
};
```

### `onDestroy`

Runs when the CLI is shutting down. Use it for:

- Closing connections
- Flushing logs
- Cleanup

```typescript
onDestroy: async ({ cli }) => {
  await flushLogs();
  await closeDatabase();
};
```

## Usage

### Global Plugins

Apply to all commands:

```typescript
import { createCli, definePlugin } from "cheloni";

const analyticsPlugin = definePlugin({
  name: "analytics",
  onCommandExecution: async ({ command, execute }) => {
    trackCommandUsage(command.name);
    return execute();
  },
});

const cli = await createCli({
  name: "my-cli",
  plugins: [analyticsPlugin],
  command: rootCommand,
});
```

### Command-Specific Plugins

Apply only to specific commands:

```typescript
import { defineCommand, definePlugin } from "cheloni";

const deploymentPlugin = definePlugin({
  name: "deployment-plugin",
  onCommandExecution: async ({ execute }) => {
    await checkDeploymentPermissions();
    return execute();
  },
});

const deployCommand = defineCommand({
  name: "deploy",
  plugins: [deploymentPlugin],
  handler: async ({ options }) => {
    // ...
  },
});
```

## Practical Examples

### Analytics Plugin

```typescript
const analyticsPlugin = definePlugin({
  name: "analytics",
  onCommandExecution: async ({ command, execute }) => {
    await trackEvent("command_started", {
      command: command.manifest.name,
      timestamp: Date.now(),
    });
    const ctx = await execute();
    await trackEvent("command_completed", {
      command: command.manifest.name,
    });
    return ctx;
  },
});
```

### Logging Plugin

```typescript
const loggingPlugin = definePlugin({
  name: "logging",
  onCommandExecution: async ({ command, execute }) => {
    console.log(`[${new Date().toISOString()}] Starting: ${command.manifest.name}`);
    await execute();
    console.log(`[${new Date().toISOString()}] Completed: ${command.manifest.name}`);
  },
});
```

### CLI Modification Plugin

```typescript
import { createCommand, defineCommand } from "cheloni";

const customHelpPlugin = definePlugin({
  name: "custom-help",
  onInit: async ({ cli }) => {
    if (!cli.command) return;

    // Add a custom subcommand to the root command
    const customHelpCommand = defineCommand({
      name: "custom-help",
      handler: async () => {
        console.log("Custom help text");
      },
    });

    const existingDef = cli.command.definition;
    const existingCommands = existingDef.commands ?? [];
    cli.command = createCommand({
      ...existingDef,
      commands: [...existingCommands, customHelpCommand],
    });
  },
});
```

## Example

```typescript
import { definePlugin, defineCommand, createCli } from "cheloni";

const timer = definePlugin({
  name: "timer",
  onCommandExecution: async ({ command, execute }) => {
    console.time(command.name);
    try {
      return await execute();
    } finally {
      console.timeEnd(command.name);
    }
  },
});

// Global — will run for every command
const cli = await createCli({
  name: "my-cli",
  plugins: [timer],
  command: rootCommand,
});

// Per-command — will run only for this command
defineCommand({
  name: "deploy",
  plugins: [timer],
  handler: async () => {
    /* ... */
  },
});
```

## Error Handling

### Hook Error Behavior

- **`onInit`**: Errors prevent CLI initialization and are thrown immediately
- **`onCommandExecution`**: If you throw before `await execute()` completes, the pipeline stops. If you throw after `await execute()` resolved, Cheloni routes `PluginAfterCommandExecutionError` to `cli.onError` without changing a successful command outcome
- **`onDestroy`**: Errors are logged during shutdown

```typescript
const plugin = definePlugin({
  name: "my-plugin",
  onCommandExecution: async ({ command, execute }) => {
    if (!hasPermission(command)) {
      throw new Error(`Permission denied for command: ${command.manifest.name}`);
    }
    await execute();
    try {
      await logCommandExecution(command);
    } catch (error) {
      console.error("Failed to log execution:", error);
    }
  },
});
```

**Key points:**

- Throw errors in `onInit` or before `execute()` finishes to stop execution
- Prefer not to throw from `onDestroy`; handle errors internally
- Use `try` / `finally` around `await execute()` when cleanup must run even if the handler throws
- Error messages are automatically displayed by the framework

## Best Practices

- **Keep hooks focused**: Each hook should do one thing well
- **Handle errors gracefully**: Hook failures can break CLI initialization or execution
- **Use `try` / `finally` around `await execute()`** when cleanup must run even if the handler throws
- **Store state in closures**: Use closures to share data between hooks
- **Make plugins reusable**: Export plugins for use across multiple CLIs

1. **Use `onInit` for structural changes** - Modify CLI structure only in `onInit`
2. **Keep hooks focused** - Each hook should do one thing well
3. **Handle errors gracefully** - Avoid throwing from `onDestroy`; after `await execute()` resolves, throws are routed to `cli.onError` rather than failing the command
4. **Use command plugins for command-specific behavior** - Global plugins for cross-cutting concerns
5. **Use `execute({ ctx })` when middleware needs your data** - Inject early context before the middleware chain; read merged values from the object returned by `await execute()` if you need validated options too
