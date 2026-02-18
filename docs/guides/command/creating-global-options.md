# Creating Global Options

Global options are available to all commands. Use them for shared functionality like verbose logging, configuration files, or authentication tokens.

## Defining Global Options

```typescript
import { defineGlobalOption } from 'cheloni';
import z from 'zod';

const verboseOption = defineGlobalOption({
  name: 'verbose',
  schema: z.boolean().optional().meta({ alias: 'V' }),
});

const tokenOption = defineGlobalOption({
  name: 'token',
  schema: z.string().meta({ alias: 't' }),
  handler: async ({ value, context }) => {
    // Handler runs before command execution
    // Can short-circuit command execution
  },
});
```

## Registering Global Options

Register global options when creating your CLI:

```typescript
const cli = await createCli({
  name: 'my-cli',
  globalOption: verboseOption, // or [option1, option2]
  command: rootCommand,
});
```

## Global Options with Handlers

Global options can have handlers that run before command execution. If a handler is provided, it can short-circuit the command execution (like `--help` or `--version`) by calling `halt()`:

```typescript
const helpOption = defineGlobalOption({
  name: 'help',
  schema: z.boolean().optional().meta({ alias: 'h' }),
  handler: ({ command, cli, halt }) => {
    // Show help and exit
    showHelp(cli, command.manifest.name);
    halt(); // Short-circuit command execution
  },
});
```

## Global Options Without Handlers

Global options without handlers are passed to the command handler:

```typescript
const verboseOption = defineGlobalOption({
  name: 'verbose',
  schema: z.boolean().optional(),
  // No handler - value is available in command handler
});

// In your command handler:
handler: async ({ options, cli }) => {
  // options.verbose is available if --verbose was passed
  if (cli.globalOptions.get('verbose')?.definition.schema) {
    // Access global option definition if needed
  }
}
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
- **Configuration**: `--config` to specify a config file path
- **Authentication**: `--token` for API authentication
- **Help and version**: `--help` and `--version` options
