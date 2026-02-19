# Creating Plugins

Plugins extend CLI functionality with lifecycle hooks. Use them for analytics, telemetry, logging, or modifying CLI structure at runtime.

## Basic Structure

```typescript
import { definePlugin } from 'cheloni';

export interface MyPluginConfig {
  level?: 'info' | 'debug';
}

const myPlugin = definePlugin((options: MyPluginConfig = {}) => ({
  name: 'my-plugin',
  onInit: async ({ cli, plugin }) => {
    // Called when CLI is created
  },
  onPreCommandExecution: async ({ cli, plugin, command }) => {
    if (options.level === 'debug') {
      console.debug('About to run', command.name);
    }
  },
  onAfterCommandExecution: async ({ cli, plugin, command }) => {
    // Called after each command execution (even if it fails)
  },
  onDestroy: async ({ cli, plugin }) => {
    // Called when CLI is shutting down
  },
}));
```

## Lifecycle Hooks

### `onInit`
Runs once when the CLI is created, before any commands execute. Use it to:
- Modify CLI structure (add commands, global options)
- Initialize services
- Set up configuration

```typescript
import { createGlobalOption, defineGlobalOption } from 'cheloni';
import z from 'zod';

const plugin = definePlugin({
  name: 'my-plugin',
  onInit: async ({ cli }) => {
    // Add a global option
    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean(),
      handler: () => {},
    });
    cli.command.manifest.bequeathOptions.add(createGlobalOption(verboseOption));
  },
});
```

### `onBeforeCommand`
Runs before each command handler. Use it for:
- Authentication checks
- Logging command start
- Performance tracking

```typescript
onBeforeCommand: async ({ cli, command }) => {
  console.log(`Executing: ${command.manifest.name}`);
  const startTime = Date.now();
  // Store in plugin state for onAfterCommand
}
```

### `onAfterCommand`
Runs after each command handler, even if it throws. Use it for:
- Cleanup
- Logging completion
- Error tracking

```typescript
onAfterCommand: async ({ cli, command }) => {
  console.log(`Completed: ${command.manifest.name}`);
  // Always runs, even if handler failed
}
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
}
```

## Usage

### Global Plugins

Apply to all commands:

```typescript
import { createCli, definePlugin } from 'cheloni';

const analyticsPlugin = definePlugin({
  name: 'analytics',
  onBeforeCommand: async ({ command }) => {
    trackCommandUsage(command.manifest.name);
  },
});

const cli = await createCli({
  name: 'my-cli',
  plugins: [analyticsPlugin],
  command: rootCommand,
});
```

### Command-Specific Plugins

Apply only to specific commands:

```typescript
import { defineCommand, definePlugin } from 'cheloni';

const deploymentPlugin = definePlugin({
  name: 'deployment-plugin',
  onBeforeCommand: async () => {
    await checkDeploymentPermissions();
  },
});

const deployCommand = defineCommand({
  name: 'deploy',
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
  name: 'analytics',
  onBeforeCommand: async ({ command }) => {
    await trackEvent('command_started', {
      command: command.manifest.name,
      timestamp: Date.now(),
    });
  },
  onAfterCommand: async ({ command }) => {
    await trackEvent('command_completed', {
      command: command.manifest.name,
    });
  },
});
```

### Logging Plugin

```typescript
const loggingPlugin = definePlugin({
  name: 'logging',
  onBeforeCommand: async ({ command }) => {
    console.log(`[${new Date().toISOString()}] Starting: ${command.manifest.name}`);
  },
  onAfterCommand: async ({ command }) => {
    console.log(`[${new Date().toISOString()}] Completed: ${command.manifest.name}`);
  },
});
```

### CLI Modification Plugin

```typescript
import { createCommand, defineCommand } from 'cheloni';

const customHelpPlugin = definePlugin({
  name: 'custom-help',
  onInit: async ({ cli }) => {
    if (!cli.command) return;

    // Add a custom subcommand to the root command
    const customHelpCommand = defineCommand({
      name: 'custom-help',
      handler: async () => {
        console.log('Custom help text');
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
import { definePlugin, defineCommand, createCli } from 'cheloni';

const timer = definePlugin({
  name: 'timer',
  onPreCommandExecution: async ({ command }) => {
    console.time(command.name);
  },
  onAfterCommandExecution: async ({ command }) => {
    console.timeEnd(command.name);
  },
});

// Global — will run for every command
const cli = await createCli({
  name: 'my-cli',
  plugins: [timer],
  command: rootCommand,
});

// Per-command — will run only for this command
defineCommand({
  name: 'deploy',
  plugins: [timer],
  handler: async () => { /* ... */ },
});
```

## Error Handling

### Hook Error Behavior

- **`onInit`**: Errors prevent CLI initialization and are thrown immediately
- **`onBeforeCommand`**: Errors prevent command execution and are displayed to the user
- **`onAfterCommand`**: Errors are logged but don't override the original handler error
- **`onDestroy`**: Errors are logged during shutdown

```typescript
const plugin = definePlugin({
  name: 'my-plugin',
  onBeforeCommand: async ({ command }) => {
    if (!hasPermission(command)) {
      throw new Error(`Permission denied for command: ${command.manifest.name}`);
    }
  },
  onAfterCommand: async ({ command }) => {
    try {
      await logCommandExecution(command);
    } catch (error) {
      // Log but don't throw - original error takes precedence
      console.error('Failed to log execution:', error);
    }
  },
});
```

**Key points:**
- Throw errors in `onInit` and `onBeforeCommand` to stop execution
- Don't throw in `onAfterCommand` or `onDestroy` - handle errors internally
- Use try-catch in cleanup hooks to prevent masking original errors
- Error messages are automatically displayed by the framework

## Best Practices

- **Keep hooks focused**: Each hook should do one thing well
- **Handle errors gracefully**: Hook failures can break CLI initialization or execution
- **Use `onAfterCommand` for cleanup**: It always runs, even if the handler throws
- **Store state in closures**: Use closures to share data between hooks
- **Make plugins reusable**: Export plugins for use across multiple CLIs

1. **Use `onInit` for structural changes** - Modify CLI structure only in `onInit`
2. **Keep hooks focused** - Each hook should do one thing well
3. **Handle errors gracefully** - `onAfterCommandExecution` and `onDestroy` should not throw
4. **Use command plugins for command-specific behavior** - Global plugins for cross-cutting concerns
5. **Avoid side effects in `onPreCommandExecution`** - Use it for validation/checks, not mutations
