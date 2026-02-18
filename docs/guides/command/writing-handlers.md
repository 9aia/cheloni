# Writing Command Handlers

## Error Handling

### Application Errors

Throw an `Error` in your handler. The framework displays the message and exits with a non-zero status code:

```typescript
handler: async ({ positional, options }) => {
  if (!fs.existsSync(positional)) {
    throw new Error(`File not found: ${positional}`);
  }
  // Your application logic
}
```

## Best Practices

### Don't Manually Validate Schema-Defined Inputs

**Action**: Let Zod validate inputs automatically—don't add manual validation for schema-defined options or positional arguments.

**Why**: The framework automatically validates all inputs against your Zod schemas and provides detailed, user-friendly error messages. Manual validation is redundant and can lead to inconsistent error messages.

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

  // ✅ Do this - let Zod handle it
  positional: yourPositionalSchema,
  options: yourOptionsSchema,
  handler: ({ positional, options }) => {
    // positional and options are already validated
    // ...
  }
}
```

### Throw Descriptive Application Errors

**Action**: When throwing errors for application logic (file operations, network requests, business rules), include specific information in the error message.

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

## Framework Behavior

The framework automatically handles validation errors. See [Error Handling Explanation](../../explanation/error-handling.md) for details.
