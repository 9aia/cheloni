# Creating Command Middleware

> This guide covers how to **create** middleware from scratch. For using existing middleware in commands, see [Defining Command Middleware](../essentials/defining-middleware.md).

Middleware runs **before** the command handler and lets you inject context, guard execution, or run side-effects.

## Defining Middleware

Use `defineMiddleware` and **always return** the result of `next()` to continue the middleware chain:

```typescript
import { defineMiddleware } from 'cheloni';

// Inject context — the handler receives `context.user`
const authMiddleware = defineMiddleware(async ({ next }) => {
  const user = await getUser();
  return next({ ctx: { user } });
});

// Side-effect only — no context added
const loggerMiddleware = defineMiddleware(async ({ next }) => {
  console.log('before');
  const result = await next();
  console.log('after');
  return result;
});
```

## Middleware Parameters

Every middleware receives a **readonly** params object (frozen at runtime):

| Parameter | Description                                                                |
| --------- | -------------------------------------------------------------------------- |
| `ctx`     | The cumulative context from all previous middleware in the chain           |
| `next`    | Function to proceed to the next middleware (optionally merging new context)|
| `cli`     | The current CLI instance                                                   |
| `command` | The command definition being executed                                      |
| `halt`    | Function to halt execution silently, without throwing an error             |

## Context Accumulation

Each `next({ ctx: { ... } })` call **deep-merges** new properties into the shared context using [`defu`](https://github.com/unjs/defu). New values take priority, nested objects are merged recursively, and arrays are concatenated. The handler's `context` type is the intersection of all middleware outputs:

```typescript
const configMiddleware = defineMiddleware(async ({ next }) => {
  return next({ ctx: { config: { verbose: true } } });
});

const authMiddleware = defineMiddleware(async ({ next }) => {
  return next({ ctx: { session: { user: 'test' } } });
});

defineCommand({
  name: 'deploy',
  middleware: [configMiddleware, authMiddleware],
  handler: async ({ context }) => {
    // context: { config: { verbose: boolean }, session: { user: string } }
  },
});
```

## Halting Execution

Call `halt()` to stop the middleware chain and the command handler **silently** (no error output, exits cleanly):

```typescript
const guardMiddleware = defineMiddleware(async ({ next, halt }) => {
  if (!isAllowed()) {
    console.log('Access denied.');
    halt(); // stops everything, no error thrown to the user
  }
  return next();
});
```

## Error Handling

Throw an error to stop the chain **with** an error message. The framework displays it and exits with a non-zero code:

```typescript
const authMiddleware = defineMiddleware(async ({ next }) => {
  if (!await isAuthenticated()) {
    throw new Error('Authentication required. Please log in first.');
  }
  return next({ ctx: { user: await getUser() } });
});
```

## Execution Order

Middleware executes sequentially in array order. Root-command middleware runs first, then subcommand middleware — all **before** option validation and the handler.

```typescript
const cli = await createCli({
  name: 'my-cli',
  command: {
    middleware: [loggerMiddleware, authMiddleware], // runs for all commands
    commands: [
      defineCommand({
        name: 'deploy',
        middleware: [configMiddleware], // runs after root middleware
        handler: async ({ context }) => { /* ... */ },
      }),
    ],
  },
});
```
