# Creating Command Middleware

> Don't confuse this with [Defining Command Middleware](../essentials/defining-middleware.md). This guide covers how to create middleware from scratch, not using a middleware that has already been created.

## Error Handling

Middleware can throw errors to stop the middleware chain and prevent command execution. Errors are automatically displayed and cause the CLI to exit with a non-zero status code:

```typescript
const authMiddleware: Middleware = async ({ context, next }) => {
  if (!context.user) {
    throw new Error('Authentication required. Please log in first.');
  }
  await next();
};
```

**Key points:**
- Throw errors for validation or authorization failures
- Errors stop the middleware chain immediately
- Use descriptive error messages
- The framework handles error display and exit codes automatically
