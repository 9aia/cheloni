# Creating Packs

Packs bundle multiple plugins together for reuse across CLIs. Use them to create feature sets that can be shared or distributed.

## Basic Structure

```typescript
import { definePluginpack, definePlugin } from 'cheloni';

const analyticsPlugin = definePlugin({
  name: 'analytics',
  onBeforeCommand: async ({ command }) => {
    trackCommandUsage(command.manifest.name);
  },
});

const loggingPlugin = definePlugin({
  name: 'logging',
  onBeforeCommand: async ({ command }) => {
    console.log(`Executing: ${command.manifest.name}`);
  },
});

const monitoringPack = definePluginpack({
  name: 'monitoring',
  plugins: [analyticsPlugin, loggingPlugin],
});
```

## Using Packs

Packs are used when creating a CLI. The pack's plugins are automatically extracted and added to the CLI:

```typescript
import { createCli } from 'cheloni';

const cli = await createCli({
  name: 'my-cli',
  command: rootCommand,
  pluginpacks: [monitoringPack],
  // You can also add individual plugins alongside packs
  plugins: [customPlugin],
});
```

## Multiple Plugins

Packs can contain a single plugin or multiple plugins:

```typescript
// Single plugin
const singlePluginPack = definePluginpack({
  name: 'auth',
  plugins: [authPlugin],
});

// Multiple plugins
const multiPluginPack = definePluginpack({
  name: 'enterprise',
  plugins: [authPlugin, analyticsPlugin, loggingPlugin, telemetryPlugin],
});
```

## Practical Examples

### Standard Library Base Pluginpack

The standard library provides a basic pluginpack with help and version support:

```typescript
import { basePluginpack } from 'cheloni/std';

const cli = await createCli({
  name: 'my-cli',
  version: '1.0.0',
  pluginpacks: [basePluginpack], // Includes help and version plugins
});
```

### Custom Feature Pack

Create a pack for a specific feature set:

```typescript
import { definePluginpack, definePlugin } from 'cheloni';

const databasePlugin = definePlugin({
  name: 'database',
  onInit: async ({ cli }) => {
    await initializeDatabase();
  },
  onDestroy: async ({ cli }) => {
    await closeDatabase();
  },
});

const cachePlugin = definePlugin({
  name: 'cache',
  onInit: async ({ cli }) => {
    await initializeCache();
  },
});

const dataPack = definePluginpack({
  name: 'data-layer',
  plugins: [databasePlugin, cachePlugin],
});
```

### Development Tools Pack

Bundle development-specific plugins:

```typescript
const devPack = definePluginpack({
  name: 'dev-tools',
  plugins: [
    verboseLoggingPlugin,
    performanceMonitoringPlugin,
    debugPlugin,
  ],
});

// Use conditionally
const cli = await createCli({
  name: 'my-cli',
  command: rootCommand,
  pluginpacks: process.env.NODE_ENV === 'development' ? [devPack] : undefined,
});
```

## Combining Packs and Plugins

You can use both packs and individual plugins together. Plugins from both sources are merged:

```typescript
const cli = await createCli({
  name: 'my-cli',
  command: rootCommand,
  pluginpacks: [basePluginpack], // Adds help and version plugins
  plugins: [customPlugin], // Adds custom plugin
  // All plugins are combined
});
```

## Best Practices

- **Group related plugins**: Packs should contain plugins that work together or provide a cohesive feature set
- **Use descriptive names**: Pack names should clearly indicate their purpose
- **Export packs for reuse**: Export packs from dedicated files for easy sharing
- **Keep packs focused**: Don't bundle unrelated plugins just for convenience
- **Document pack contents**: Include comments or documentation about what each pack provides

## Error Handling

Packs themselves don't execute code—they're just containers for plugin definitions. Error handling follows the same rules as plugins:

- Plugin `onInit` errors prevent CLI initialization
- Plugin `onBeforeCommand` errors prevent command execution
- Plugin `onAfterCommand` errors are logged but don't override handler errors
- Plugin `onDestroy` errors are logged during shutdown

See [Creating Plugins](./creating-plugins.md#error-handling) for detailed error handling guidance.

```typescript
const pack = definePluginpack({
  name: 'my-pack',
  plugins: [
    definePlugin({
      name: 'plugin-with-error-handling',
      onBeforeCommand: async ({ command }) => {
        if (!hasPermission(command)) {
          throw new Error(`Permission denied for command: ${command.manifest.name}`);
        }
      },
    }),
  ],
});
```
