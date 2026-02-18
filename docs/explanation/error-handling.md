# Error Handling

How Cheloni handles errors automatically and formats error messages.

## Framework-Handled Errors

The framework automatically handles and formats several types of errors:

### Command Errors

- **Command not found**: Invalid command path
- **No command specified**: When no command is provided
- **No commands registered**

### Schema Errors

- **Unknown options**: Invalid options (if `throwOnExtrageousOptions` is `'throw'`)
- **Invalid option values**: Values don't match schema
- **Missing required options**: Required options not provided
- **Invalid positional arguments**: Positional args don't match schema

## Error Display

Error messages include field names, descriptions, and specific validation details:

```
Validation error:
  option --output: Output file path: Required
  positional argument: Path to the JPEG image: Expected string, received number
```

### Error Format

- **Validation errors** (`ZodError`): Formatted with field names, descriptions, and validation messages
- **Application errors** (`Error`): Displayed directly
- All errors cause CLI to exit with a non-zero status code
