# Pipeline

## Execution Flow

1. **Parse arguments** - Extract positional args and options
2. **Run middleware** - Execute middleware chain (if any)
3. **Validate inputs** - Validate with Zod
4. **Execute handler** - Run command handler

## Middleware

Middleware runs before handlers and can modify execution context. Perfect for authentication, logging, rate limiting, and context enrichment.

Middleware functions receive a `next` function to continue the chain and can modify data:

```typescript
import { type Middleware, defineCommand } from 'cheloni';

const auth: Middleware = async ({ command, data, next }) => {
  const user = await authenticate();
  data.user = user;
  return await next({ 
    data
  });
};

const logger: Middleware = async ({ command, data, next }) => {
  console.log(`Executing: ${command.manifest.name}`);
  return await next();
};

const command = defineCommand({
  middleware: [auth, logger], // Executes in order
  handler: async ({ data }) => {
    // data.user is available here
  },
});
```

### Use Cases

- **Authentication**: Verify user before command execution
- **Logging**: Track command usage and performance
- **Rate limiting**: Prevent abuse
- **Context enrichment**: Add shared data (user, config, etc.)

## Handler

Handlers receive validated inputs and execution context:

```typescript
handler: async ({ positional, options, data, cli, command }) => {
  // positional: Inferred type from positional schema
  // options: Inferred type from options schema
  // data: Middleware data
  // cli: CLI instance
  // command: Command instance
}
```
