# Cheloni

> [!IMPORTANT]
> This project is a work in progress and is not yet ready for production.

**Cheloni** is a modern, type-safe CLI framework for TypeScript. Build powerful command-line tools with full type inference, Zod-based validation, and a flexible plugin system—all without writing a single manual type annotation.

## Quick Start

1. Install the package
    ```bash
    bun add cheloni
    ```

2. Create a simple CLI

```typescript
// hello.ts
import { createCli, defineRootCommand, executeCli } from 'cheloni';
import z from 'zod';

const helloWorld = defineRootCommand({
  positional: z.string(),
  handler: async ({ positional }) => {
    console.log(`Hello, ${positional}!`);
  },
});

const cli = await createCli({
  name: 'hello-world',
  command: helloWorld,
});

await executeCli({ cli });
```

3. Run your CLI
    ```bash
    bun run hello.ts world
    // Output: Hello, world!
    ```

## Features

- **Zero Manual Types**: Full TypeScript inference from Zod schemas—define once, get types everywhere
- **One Schema, Three Benefits**: Define with Zod and get validation, type safety, and auto-generated documentation automatically
- **User-Friendly Errors**: Intelligent error messages with field names, descriptions, and validation details—no configuration needed
- **Plugin System**: Lifecycle hooks (`onInit`, `onBeforeCommand`, `onAfterCommand`, `onDestroy`) that can modify CLI structure at runtime
- **Dynamic Options**: Support for arbitrary key-value options with `z.record()` for flexible CLI patterns
- **Middleware Pipeline**: Pre-handler execution hooks for cross-cutting concerns like auth, logging, and telemetry

## Contributing

You can contribute to the project by submitting pull requests or by creating an issue.

---

[Documentation](./docs/docs.md) | [Project](./project/index.md) | [License](./LICENSE)
