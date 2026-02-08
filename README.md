# Cheloni

> [!IMPORTANT]
> This project is a work in progress and is not yet ready for production.

A type-safe, schema-based framework for building CLI with full TypeScript inference.

## Quick Start

```typescript
import { defineCommand, run } from 'cheloni';
import z from 'zod';

const command = defineCommand({
  positional: z.string(),
  options: z.object({
    verbose: z.boolean().optional(),
  }),
  handler: async ({ positional, options }) => {
    console.log(`Processing: ${positional}`);
    if (options.verbose) console.log('Verbose mode');
  },
});

run({
  manifest: { command },
});
```

## Features

- **Full Type Safety**: Types inferred from Zod schemas
- **Flexible Options**: Support `z.object()` and `z.record()` for dynamic options
- **Aliases**: Define multiple paths and option aliases per command
- **Middleware**: Pre-handler execution hooks
- **Smart Error Messages**: Context-aware validation errors
- **Built-in Help Command**: Automatically generates help text from your command definitions
- **Built-in Version Command**: Automatically generates version text from your command definitions

## Documentation

### Features

- [Error Handling](./docs/features/error-handling.md)

### Guides (How to Use)

- [Getting Started](./docs/guides/getting-started.md)
- [Best Practices](./docs/guides/best-practices.md)
- [Aliases](./docs/guides/aliases.md)
- [Building CLI Wrappers](./docs/guides/cli-wrappers.md)
- [Dynamic Options](./docs/guides/dynamic-options.md)
- [Error Handling](./docs/guides/error-handling.md)

### How It Works

// TODO

### Design Explanations

- [Options Schema](./docs/why-design/options-schema.md)
- [throwOnExtrageousOptions](./docs/why-design/throw-on-extrageous-options.md)

### Reference

// TODO
