# Error Handling

The framework automatically handles errors and provides context-aware error messages. You generally don't need to implement custom error handling—just throw errors when they occur, and the framework will display them appropriately.

## Framework-Handled Errors

The following errors are automatically handled by the framework:

### Command Errors

- **Command not found**: When a user provides an invalid command path
- **No command specified**: When no command is provided
- **No commands registered**: When the manifest is empty

### Validation Errors

- **Unknown options**: When invalid options are provided (if `throwOnExtrageousOptions` is `'throw'`)
- **Invalid option values**: When option values don't match the schema (e.g., string instead of number)
- **Missing required options**: When required options are not provided
- **Invalid positional arguments**: When positional arguments don't match the schema

The framework provides detailed, context-aware error messages that include:
- The field name (with description if available)
- The specific validation error message
- Available options (for unknown option errors)

**Example validation error output:**
```
Validation error:
  option --output: Output file path: Required
  positional argument: Path to the JPEG image to convert: Expected string, received number
```

## Application Errors

For application-specific errors (e.g., file operations, network requests, business logic), simply throw an `Error` in your handler. The framework will automatically display the error message and exit with a non-zero status code.

```typescript
handler: async ({ positional, options }) => {
  if (!fs.existsSync(positional)) {
    throw new Error(`File not found: ${positional}`);
  }
  
  if (!fs.accessSync(positional, fs.constants.R_OK)) {
    throw new Error(`File not readable: ${positional}`);
  }
  
  // Your application logic here
}
```

## Error Display

When an error is thrown in your handler:

1. **Validation errors** (`ZodError`): The framework formats these with field names, descriptions, and specific validation messages
2. **Application errors** (`Error`): The framework displays the error message directly
3. **Unknown errors**: The framework displays a generic error message

All errors cause the CLI to exit with a non-zero status code.
