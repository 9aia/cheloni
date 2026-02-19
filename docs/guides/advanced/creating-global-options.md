# Creating Global Options

Global options are available to all commands. Use them for shared functionality like verbose logging, configuration files, or authentication tokens.

**Note**: Global options are implemented using `bequeathOptions` on the root command. Options defined in `bequeathOptions` on the root command are available to the root command itself and all its subcommands, making them effectively "global" to the CLI.

## Defining Global Options

```typescript
import { defineGlobalOption, defineRootCommand } from 'cheloni';
import z from 'zod';

const verboseOption = defineGlobalOption({
  name: 'verbose',
  schema: z.boolean().optional().meta({ aliases: ['V'] }),
});

const tokenOption = defineGlobalOption({
  name: 'token',
  schema: z.string().meta({ aliases: ['t'] }),
  handler: async ({ value, context }) => {
    // Handler runs before command execution
    // Can short-circuit command execution
  },
});
```

## Registering Global Options

Register global options on the root command using `bequeathOptions`:

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

## Global Options with Handlers

Global options can have handlers that run before command execution. If a handler is provided, it can short-circuit the command execution (like `--help` or `--version`) by calling `halt()`:

```typescript
const helpOption = defineGlobalOption({
  name: 'help',
  schema: z.boolean().optional().meta({ aliases: ['h'] }),
  handler: ({ command, cli, halt }) => {
    // Show help and exit
    showHelp(cli, command.manifest.name);
    halt(); // Short-circuit command execution
  },
});

const rootCommand = defineRootCommand({
  bequeathOptions: [helpOption],
  commands: [/* ... */],
});
```

## Global Options Without Handlers

Global options without handlers are available to all commands:

```typescript
const verboseOption = defineGlobalOption({
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

Global option handlers can throw errors to stop command execution. Errors are automatically displayed and cause the CLI to exit with a non-zero status code:

```typescript
const tokenOption = defineGlobalOption({
  name: 'token',
  schema: z.string(),
  handler: async ({ value, context }) => {
    const session = await getSession(value);
    if (!session) {
      throw new Error('Unauthorized');
    }
    context.user = session.user;
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
