# Cheloni

> [!IMPORTANT]
> This project is a work in progress and is not yet ready for production.

A type-safe, schema-based framework for building CLI with full TypeScript inference.

## Quick Start

1. Install the package
    ```bash
    bun add cheloni
    ```

2. Code your CLI

```typescript
// main.ts
import { createCli, defineCommand, executeCli } from 'cheloni';
import z from 'zod';

const command = defineCommand({
  name: 'process',
  positional: z.string(),
  options: z.object({
    verbose: z.boolean().optional(),
  }),
  handler: async ({ positional, options }) => {
    console.log(`Processing: ${positional}`);
    if (options.verbose) console.log('Verbose mode');
  },
});

const cli = await createCli({
  name: 'my-cli',
  command,
});

await executeCli({ cli });
```

3. Run your CLI
    ```bash
    bun run main.ts
    ```

## Features

- **Zero Manual Types**: Full TypeScript inference from Zod schemas—define once, get types everywhere
- **One Schema, Three Benefits**: Define with Zod and get validation, type safety, and auto-generated documentation automatically
- **Context-Aware Errors**: Intelligent error messages with field names, descriptions, and validation details—no configuration needed
- **Plugin System**: Lifecycle hooks (`onInit`, `onBeforeCommand`, `onAfterCommand`, `onDestroy`) that can modify CLI structure at runtime
- **Dynamic Options**: Support for arbitrary key-value options with `z.record()` for flexible CLI patterns
- **Middleware Pipeline**: Pre-handler execution hooks for cross-cutting concerns like auth, logging, and telemetry

## Documentation

### Features

- [Overview](./docs/features/overview.md)
- [Error Handling](./docs/features/error-handling.md)
- [Plugin System](./docs/features/plugin.md)
- [Pipeline](./docs/features/pipeline.md)
- [Advanced Features](./docs/features/advanced-features.md)

### Guides (How to Use)

- [Getting Started](./docs/guides/getting-started.md)
- [Best Practices](./docs/guides/best-practices.md)
- [Aliases](./docs/guides/aliases.md)
- [Building CLI Wrappers](./docs/guides/cli-wrappers.md)
- [Dynamic Options](./docs/guides/dynamic-options.md)
- [Error Handling](./docs/guides/error-handling.md)

### How It Works

- [Core Architecture](./docs/how-it-works/core-architecture.md)

### Design Explanations

- [Options Schema](./docs/why-design/options-schema.md)
- [throwOnExtrageousOptions](./docs/why-design/throw-on-extrageous-options.md)

### Reference

_Coming soon_
