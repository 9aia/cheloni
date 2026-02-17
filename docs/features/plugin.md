# Plugin System

Plugins extend CLI functionality with lifecycle hooks. Perfect for analytics, telemetry, logging, and global configuration.

## Lifecycle Hooks

```typescript
import { type Plugin } from 'cheloni';

const analyticsPlugin: Plugin = {
  name: 'analytics',
  onInit: async ({ cliManifest }) => {
    // Called when CLI is initialized (before any commands run)
  },
  onBeforeCommand: async ({ cli, commandManifest }) => {
    // Called before each command execution
  },
  onAfterCommand: async ({ cli, commandManifest }) => {
    // Called after each command execution (even if it fails)
  },
  onDestroy: async ({ cliManifest }) => {
    // Called when CLI is shutting down
  },
};
```

## Usage

### Global Plugins

```typescript
const cli = await createCli({
  name: 'my-cli',
  plugin: [analyticsPlugin, loggingPlugin], // Applied to all commands
  command: [/* ... */],
});
```

### Command-Specific Plugins

```typescript
const command = defineCommand({
  name: 'deploy',
  plugin: [deploymentPlugin], // Only runs for this command
  handler: async ({ options }) => {
    // ...
  },
});
```

> **Note**: Lazy loading for commands and plugins is a planned feature but not yet implemented.

## Use Cases

- **Analytics**: Track command usage and performance
- **Telemetry**: Send metrics to monitoring services
- **Logging**: Centralized logging across all commands
- **Error tracking**: Capture and report errors
- **Feature flags**: Enable/disable features per command
- **Programmatic access**: Access CLI instance and metadata from plugins
