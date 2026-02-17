# Advanced Features

Powerful features for complex CLI scenarios: aliases, dynamic options, global features, and CLI wrappers.

## Aliases

### Command Aliases

Multiple command paths for the same command:

```typescript
const build = defineCommand({
  paths: ['build', 'b'], // Both 'build' and 'b' work
  handler: async ({ options }) => {
    // ...
  },
});
```

### Option Aliases

Short flags via metadata:

```typescript
const command = defineCommand({
  options: z.object({
    output: z.string().optional().meta({ alias: 'o' }), // -o or --output
    normalize: z.boolean().optional().meta({ 
      alias: ['n', 'c'] // -n, -c, or --normalize
    }),
  }),
});
```

Aliases are automatically included in help text and error messages.

## Dynamic Options

Use `z.record()` for arbitrary key-value options:

```typescript
const updateJson = defineCommand({
  options: z.record(z.string(), z.string()),
  handler: async ({ options }) => {
    // Accepts any key-value pairs: --key1=value1 --key2=value2
    Object.assign(someObject, options);
  },
});
```

Usage: `my-cli update-json --title="My Project" --author="Alice"`

## Global Features

Share options and plugins across all commands:

```typescript
import { defineGlobalOption } from 'cheloni';

const verboseOption = defineGlobalOption({
  name: 'verbose',
  schema: z.boolean().optional(),
  handler: () => {},
});

const cli = await createCli({
  name: 'my-cli',
  globalOption: verboseOption,
  plugin: analyticsPlugin,
  command: rootCommand,
});
```

> **Note**: Global commands and global positional arguments are planned features but not yet implemented.

## CLI Wrappers

Forward options to underlying tools with `throwOnExtrageousOptions: 'pass-through'`:

```typescript
const build = defineCommand({
  options: z.object({
    dryRun: z.boolean().optional().meta({ alias: 'd' }),
  }),
  throwOnExtrageousOptions: 'pass-through', // Forward unknown options
  handler: async ({ options }) => {
    const { dryRun, ...forwardedOptions } = options;
    // Forward forwardedOptions to underlying tool
  },
});
```

Other modes:
- `'throw'` (default): Reject unknown options
- `'filter-out'`: Silently ignore unknown options
