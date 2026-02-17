# Error Handling

Automatic error handling with context-aware messages. Just throw errors—the framework displays them appropriately.

## Framework-Handled Errors

### Command Errors
- **Command not found**: Invalid command path
- **No command specified**: When no command is provided
- **No commands registered**

### Schema Errors
- **Unknown options**: Invalid options (if `throwOnExtrageousOptions` is `'throw'`)
- **Invalid option values**: Values don't match schema
- **Missing required options**: Required options not provided
- **Invalid positional arguments**: Positional args don't match schema

Error messages include field names, descriptions, and specific validation details:

```
Validation error:
  option --output: Output file path: Required
  positional argument: Path to the JPEG image: Expected string, received number
```

## Application Errors

Simply throw an `Error` in your handler. The framework displays the message and exits with a non-zero status code:

```typescript
handler: async ({ positional, options }) => {
  if (!fs.existsSync(positional)) {
    throw new Error(`File not found: ${positional}`);
  }
  // Your application logic
}
```

## Error Display

- **Validation errors** (`ZodError`): Formatted with field names, descriptions, and validation messages
- **Application errors** (`Error`): Displayed directly
- All errors cause CLI to exit with a non-zero status code
