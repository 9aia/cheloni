# Creating Reusable Options

Bequeath options are options that are inherited by subcommands. When defined on the root command, they are available to all commands — making them effectively "global" to the CLI. Use them for shared functionality like verbose logging, configuration files, or authentication tokens.

## Defining Options

```typescript
import { defineOption, defineRootCommand } from 'cheloni';
import z from 'zod';

const verboseOption = defineOption({
  name: 'verbose',
  schema: z.boolean().optional().meta({ aliases: ['V'] }),
});

const tokenOption = defineOption({
  name: 'token',
  schema: z.string().meta({ aliases: ['t'] }),
  handler: async ({ value, next }) => {
    // Runs after middleware, before the command handler; return next() to continue
    return next({ ctx: { token: value } });
  },
});
```

## Registering Bequeath Options

Register bequeath options on a command using `bequeathOptions`:

```typescript
const rootCommand = defineRootCommand({
  bequeathOptions: [verboseOption], // Available to all commands
  commands: [/* ... */],
});

const cli = await createCli({
  name: 'my-cli',
  command: rootCommand,
});
```

## Options with Handlers

Options can have handlers that run after middleware and before the command handler. Handlers use the same `next` / `next({ ctx })` pattern as command middleware: return `next()` to continue, or `next({ ctx: { ... } })` to merge fields into `ctx` for the command handler. They can short-circuit (like `--help` or `--version`) by calling `halt()` instead of `next()`:

```typescript
const helpOption = defineOption({
  name: 'help',
  schema: z.boolean().optional().meta({ aliases: ['h'] }),
  handler: ({ command, cli, halt }) => {
    showHelp({ cli, commandName: command.manifest.name });
    return halt(); // Short-circuit command execution
  },
});

const rootCommand = defineRootCommand({
  bequeathOptions: [helpOption],
  commands: [/* ... */],
});
```

## Options Without Handlers

Bequeath options without handlers are available to all subcommands:

```typescript
const verboseOption = defineOption({
  name: 'verbose',
  schema: z.boolean().optional(),
  // No handler - available to all commands
});

const rootCommand = defineRootCommand({
  bequeathOptions: [verboseOption],
  commands: [
    defineCommand({
      name: 'build',
      handler: async ({ options }) => {
        // options.verbose is available if --verbose was passed
        if (options.verbose) {
          console.log('Verbose mode enabled');
        }
      },
    }),
  ],
});
```

## Error Handling

Option handlers can throw errors to stop command execution. Errors are automatically displayed and cause the CLI to exit with a non-zero status code:

```typescript
const tokenOption = defineOption({
  name: 'token',
  schema: z.string(),
  handler: async ({ value, next }) => {
    const session = await getSession(value);
    if (!session) {
      throw new Error('Unauthorized');
    }
    return next({ ctx: { user: session.user } });
  },
});
```

**Key points:**
- Throw errors for validation failures in handlers
- Use descriptive error messages
- Schema validation errors are handled automatically by the framework
- Handler errors prevent command execution

## Use Cases

- **Verbose logging**: `--verbose` / `-v` flag available to all commands
- **Configuration**: `--config` to specify a config file path (see [Configuration (std)](../std/config.md))
- **Authentication**: `--token` for API authentication
- **Help and version**: `--help` and `--version` options
