# Cheloni

> [!IMPORTANT]
> This project is a work in progress and is not yet ready for production.

**Cheloni** is a modern, type-safe CLI framework for TypeScript. Build powerful command-line tools with full type inference, Zod-based validation, and a flexible plugin system—all without writing a single manual type annotation.

## Overview

```typescript
import { createCli, defineCommand, defineRootCommand, executeCli } from "cheloni";
import { configPlugin } from "cheloni/std/config";
import { dryRunOptionSchema } from "cheloni/std/core";
import { basicPluginKit } from "./plugin-kits/basic-kit";
import { authMiddleware, loggerMiddleware } from "your-lib";
import z from "zod";

const deploy = defineCommand({
  name: "deploy",
  description: "Deploy to production",
  paths: ["deploy", "d"], // `d` is now considered a alias for the command
  positional: z.string().meta({ description: "Environment (staging|production)" }),
  options: z.object({
    dryRun: dryRunOptionSchema,
    force: z
      .boolean()
      .optional()
      .meta({ aliases: ["f"] }),
  }),
  examples: ["deploy staging", "deploy production --force"],
  details: "Deploys your application to the specified environment.",
  middleware: [authMiddleware],
  handler: async ({ positional, options, ctx }) => {
    // Full type inference:
    // {
    //   positional: string,
    //   options: { dryRun?: boolean, force?: boolean },
    //   ctx: { session: Session }
    // }
    console.log(`Deploying to ${positional}...`);
    if (options.dryRun) console.log("Dry run mode");
    if (options.force) console.log("Force mode enabled");
  },
});

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  command: defineRootCommand({
    commands: [deploy],
    middleware: [loggerMiddleware], // Runs for all commands
    bequeathOptions: [], // Options inherited by subcommands
  }),
  plugins: [
    configPlugin,
    ...basicPluginKit, // Adds deprecation warnings, help/version support, and default error handling
  ],
});

await executeCli({ cli });
```

**That's it!** Zero manual types, full validation, and complete type safety. Try `my-cli deploy staging -n`.

## Contributing

You can contribute to the project by submitting pull requests or by creating an issue.

## Development

- Check everything is ready:

```bash
vp run ready
```

- Run the tests:

```bash
vp run test
```

- Build the monorepo:

```bash
vp run build
```

- Build the monorepo in development mode:

```bash
vp run dev
```

---

[Documentation](./docs/docs.md) | [Project](./project/index.md) | [License](./LICENSE)
