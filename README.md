# Cheloni

> [!IMPORTANT]
> This project is a work in progress and is not yet ready for production.

**Cheloni** is a modern, type-safe CLI framework for TypeScript. Build powerful command-line tools with full type inference, Zod-based validation, and a flexible plugin system—all without writing a single manual type annotation.

## Overview

```typescript
import { createCli, defineCommand, defineRootCommand, defineMiddleware, defineGlobalOption, executeCli } from 'cheloni';
import { stdPack } from 'cheloni/std';
import z from 'zod';
import { authMiddleware, loggerMiddleware, configMiddleware } from 'your-lib';

const deploy = defineCommand({
  name: 'deploy',
  description: 'Deploy to production',
  positional: z.string().meta({ description: 'Environment (staging|production)' }),
  options: z.object({
    dryRun: z.boolean().optional().meta({ alias: 'n' }),
  }),
  middleware: [authMiddleware], // Handle auth and provides it to the handler
  handler: async ({ positional, options, context }) => {
    // { positional: string, options: { dryRun?: boolean }, context: { session: Session } }
    console.log(`Deploying to ${positional}...`);
    if (options.dryRun) console.log('Dry run mode');
  },
});


const cli = await createCli({
  name: pkg.name,
  version: pkg.version,
  command: defineRootCommand({
    command: [deploy],
    middleware: [loggerMiddleware], // Runs for all commands
  }),
  pack: stdPack, // Adds help and version commands
});

await executeCli({ cli });
```

**That's it!** Zero manual types, full validation, and complete type safety. Try `my-cli build src --watch --minify`.

## Contributing

You can contribute to the project by submitting pull requests or by creating an issue.

---

[Documentation](./docs/docs.md) | [Project](./project/index.md) | [License](./LICENSE)
