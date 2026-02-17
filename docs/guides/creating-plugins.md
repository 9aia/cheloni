# Creating Plugins

Plugins extend CLI functionality with lifecycle hooks. Use them for analytics, telemetry, logging, or modifying CLI structure at runtime.

## Basic Structure

```typescript
import { definePlugin } from 'cheloni';

const myPlugin = definePlugin({
  name: 'my-plugin',
  onInit: async ({ cli, plugin }) => {
    // Called when CLI is created
  },
  onBeforeCommand: async ({ cli, plugin, command }) => {
    // Called before each command execution
  },
  onAfterCommand: async ({ cli, plugin, command }) => {
    // Called after each command execution (even if it fails)
  },
  onDestroy: async ({ cli, plugin }) => {
    // Called when CLI is shutting down
  },
});
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
    cli.globalOptions.add(createGlobalOption(verboseOption));
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
  plugin: analyticsPlugin,
  command: [/* ... */],
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
  plugin: deploymentPlugin,
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
    // Add a custom command
    const customHelpCommand = defineCommand({
      name: 'custom-help',
      handler: async () => {
        console.log('Custom help text');
      },
    });
    cli.rootCommands.add(createCommand(customHelpCommand));
  },
});
```

## Best Practices

- **Keep hooks focused**: Each hook should do one thing well
- **Handle errors gracefully**: Hook failures can break CLI initialization or execution
- **Use `onAfterCommand` for cleanup**: It always runs, even if the handler throws
- **Store state in closures**: Use closures to share data between hooks
- **Make plugins reusable**: Export plugins for use across multiple CLIs
