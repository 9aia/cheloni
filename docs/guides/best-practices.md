# Best Practices

## Creating CLI

For bigger projects, we suggest organizing commands in separate files and import them into a single `manifest.ts`.

```typescript
import { createCli, defineCommand, executeCli } from 'cheloni';

// commands/manifest.ts
import command1 from './command1';
import command2 from './command2';

const rootCommand = defineCommand({
  name: 'root',
  command: [command1, command2],
});

const cli = await createCli({
  name: 'my-cli',
  command: rootCommand,
});

await executeCli({ cli });
```

> **Note**: Lazy loading for commands and plugins is a planned feature but not yet implemented. For now, import commands directly.

## Command Definition

**Do**: `const command = defineCommand({ ... })` or `export default defineCommand({ ... })`

**Don't**: `const command: Command = { ... }`  

**Why**: Using `defineCommand` gives you type-safe access to values in your handler, making your code safer and developer experience better.

## Documentation

1. **Be specific**: "Output file path" is better than "Output"
2. **Include examples**: "PDF language (e.g., en-US, es-ES)"
3. **Explain constraints**: "Comma-separated keywords"
4. **Use details for complex options**: Provide additional context in `details`
5. **Consistent formatting**: Use similar style across all descriptions

### Provide Global Examples

Provide global examples to help users understand how to use the command.

```typescript
defineCommand({
  // ...
  example: [
    'my-cli convert ./images/photo.jpg',
    'my-cli convert ~/Downloads/photo.jpg --normalize',
  ],
});
```

### Provide Good Metadata

The framework includes a built-in help command (`my-cli help`, `my-cli <command?> --help|-h`) that automatically generates help text from your command definitions and also enables auto-generated reference documentation. Provide good metadata to ensure comprehensive, auto-generated help.

#### Positional Arguments

Add a `description` to help users understand what the positional argument expects:

```typescript
{
  positional: z.string().meta({ 
    description: 'Path to the JPEG image to convert',
    details: dedent`
      Specify the path to the input JPEG file you wish to convert to PDF.
      Relative and absolute paths are accepted.
    `,
    example: 'my-cli convert ./images/photo.jpg',
  })
}
```

#### Options

Provide both `description` (short) and `details` (long) for better help output:

```typescript
{
  options: z.object({
    output: z.string().optional().meta({
      description: 'Output file path',
      alias: 'o',
      example: [
        'my-cli convert ./images/photo.jpg -o ./images/photo.pdf',
        'my-cli convert ~/Downloads/photo.jpg -o ~/Downloads/photo.pdf',
      ]
    }),
    normalize: z.boolean().optional().meta({
      description: 'Normalize the filename',
      details: dedent`
        Normalize the filename by removing diacritical marks,
        replacing special characters with underscores, and
        collapsing multiple underscores.
      `,
      alias: 'n',
      example: 'my-cli convert ~/Downloads/photo.jpg -n',
    }),
  })
}
```

## Error Handling

### Don't Manually Validate Schema-Defined Inputs

**Action**: Let Zod validate inputs automatically—don't add manual validation for schema-defined options or positional arguments.

**Why**: The framework automatically validates all inputs against your Zod schemas and provides detailed, context-aware error messages. Manual validation is redundant and can lead to inconsistent error messages.

```typescript
{
  // ❌ Don't do this
  handler: ({ positional, options }) => {
    if (!positional) {
      throw new Error('Positional argument required');
    }
    if (typeof options.output !== 'string') {
      throw new Error('Output must be a string');
    }
    // ...
  }

  // ✅ Do this - let the Zod handle it
  positional: yourPositionalSchema,
  options: yourOptionsSchema,
  handler: ({ positional, options }) => {
    // positional and options are already validated
    // ...
  }
}
```

### Throw Descriptive Application Errors

**Action**: When throwing errors for application logic (file operations, network requests, business rules), include specific context in the error message.

**Why**: Descriptive error messages help users understand what went wrong and how to fix it. The framework will automatically display your error message, so make it actionable.

```typescript
// ❌ Less helpful
throw new Error('Error');

// ✅ Better
throw new Error(`File not found: ${filePath}`);
throw new Error(`Cannot write to ${outputPath}: Permission denied`);
throw new Error(`Invalid file format: expected PDF, got ${actualFormat}`);
```

### Use Try-Catch Only for Application Logic

**Action**: Only use try-catch blocks for application-specific error handling like cleanup, retries, or resource management. Always re-throw errors after handling.

**Why**: This allows you to perform necessary cleanup or recovery while still letting the framework display the error to the user.

```typescript
handler: async ({ options }) => {
  let resource;
  try {
    resource = await acquireResource();
    await riskyOperation(resource);
  } catch (error) {
    // Cleanup before re-throwing
    if (resource) {
      await releaseResource(resource);
    }
    throw error; // Re-throw so framework can display it
  }
}
```

### Throw Errors for Application Failures

**Action**: Simply throw an `Error` when application operations fail (file not found, permission denied, network errors, etc.). Don't implement custom error display logic.

**Why**: The framework automatically displays thrown errors and exits with the appropriate status code. This keeps your code focused on business logic rather than error presentation.
