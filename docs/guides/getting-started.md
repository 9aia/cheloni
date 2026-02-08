# Getting Started

## Basic Command

```typescript
import { defineCommand, run } from 'cheloni';
import z from 'zod';

const convert = defineCommand({
  positional: z.string().meta({ description: 'Input file path' }),
  options: z.object({
    output: z.string().optional().meta({ description: 'Output path', alias: 'o' }),
  }),
  handler: async ({ positional, options }) => {
    // Types are automatically inferred from schemas
    // positional: string
    // options: { output?: string }
    console.log(`Converting ${positional}...`);
  },
});

run({
  manifest: { convert },
});
```

## Middleware

You can use middleware to run code before the handler. It might be useful for authentication, logging, etc.

```typescript
import { type Manifest, type Middleware, run, defineCommand } from 'cheloni';

const intro: Middleware = () => {
  console.log('Starting...');
};

const command = defineCommand({
  middleware: [intro],
  handler: async ({ options }) => {
    // Middleware runs before handler
  },
});
```

You can export the middleware function and use it in multiple commands.

## Multiple Commands

```typescript
import { type Manifest, run, defineCommand } from 'cheloni';

const command1 = defineCommand({ /* ... */ });
const command2 = defineCommand({ /* ... */ });

const manifest: Manifest = {
  command1,
  command2,
};

run({ manifest });
```

For bigger projects, we suggest organizing commands in separate files and import them into a single `manifest.ts`.
