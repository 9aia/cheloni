# Creating a CLI

## Best Practices

### File Structure

**Do**: Organize commands in separate files and import them into a single `manifest.ts`.

    For bigger projects, we suggest organizing commands in separate files and import them into a single `manifest.ts`.

    ```typescript
    import { createCli, defineCommand, executeCli } from 'cheloni';

    // commands/manifest.ts
    import command1 from './command1';
    import command2 from './command2';

    const rootCommand = defineCommand({
    name: 'root',
    commands: [command1, command2],
    });

    const cli = await createCli({
    name: 'my-cli',
    command: rootCommand,
    });

    await executeCli({ cli });
    ```

    > **Note**: Lazy loading for commands and plugins is a planned feature but not yet implemented. For now, import commands directly.

**Don't**: Import commands directly into the CLI file.

**Why**:

## Error Handling

Wrap `createCli` and `executeCli` in try-catch to handle panic situations:

```typescript
try {
  const cli = await createCli({
    name: 'my-cli',
    command: rootCommand,
  });
  
  await executeCli({ cli });
} catch (error) {
  if (error instanceof Error) {
    console.error("Panic: ", error.message);
    process.exit(1);
  }
  throw error;
}
```

**Key points:**
- `createCli` can throw if command definitions are invalid
- `executeCli` automatically handles command execution errors
- Handle initialization errors explicitly if needed
- Command handler errors are automatically displayed by the framework
