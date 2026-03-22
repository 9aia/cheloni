# Introduction

## What is Cheloni?

Cheloni (pronounced /keˈlɔːni/) is a modern, type-safe CLI framework for TypeScript. Build powerful command-line tools with full type inference, Zod-based validation, and a flexible plugin system—all without writing a single manual type annotation.

## Architecture

Cheloni follows a four-phase architecture: **Definition** → **Manifest** → **Creation** → **Execution**.

### Definition

Define your CLI structure using `define*` functions. These return plain objects with full type inference — nothing is created or executed yet.

```typescript
import { defineCommand, defineRootCommand, defineOption, definePlugin, defineCli } from "cheloni";
import z from "zod";

const convert = defineCommand({
  name: "convert",
  paths: ["convert", "c"],
  description: "Convert a file",
  positional: z.string().meta({ description: "Input file" }),
  options: z.object({
    output: z
      .string()
      .optional()
      .meta({ aliases: ["o"], description: "Output path" }),
    quality: z.number().min(0).max(100).optional(),
  }),
  middleware: [authMiddleware],
  plugins: [telemetryPlugin],
  examples: ["my-cli convert image.png --output result.webp"],
  throwOnExtrageousOptions: "throw",
  handler: async ({ positional, options, ctx, command, cli }) => {
    // positional: string, options: { output?: string, quality?: number }
    // ctx: merged middleware + bequeath-option handler context
  },
});

const root = defineRootCommand({ commands: [convert, ...otherCommands] });

const verboseOption = defineOption({
  name: "verbose",
  schema: z
    .boolean()
    .optional()
    .meta({ aliases: ["V"] }),
});

const tokenOption = defineOption({
  name: "token",
  schema: z.string().meta({ aliases: ["t"] }),
  handler: async ({ value, next }) => {
    const session = await getSession(value);
    if (!session) {
      throw new Error("Unauthorized");
    }
    return next({ ctx: { user: session.user } });
  },
});

const circuitBreakerOption = defineOption({
  name: "circuit-breaker",
  handler: async ({ next, halt }) => {
    if (yourConditionToShortCircuitExecution) {
      return halt();
    }
    return next();
  },
});

const analytics = definePlugin({
  name: "analytics",
  onInit: async ({ cli }) => {
    /* ... */
  },
  onBeforeCommandExecution: async ({ cli, command, execute }) => {
    /* ... */
    return execute();
  },
  onAfterCommandExecution: async ({ cli, command }) => {
    /* ... */
  },
  onDestroy: async ({ cli }) => {
    /* ... */
  },
});

const observabilityKit = [analytics, ...otherPlugins];

const rootCommand = defineRootCommand({
  commands: [
    /* ... */
  ],
  bequeathOptions: [circuitBreakerOption, ...otherBequeathOptions], // Available to all commands
});

const cli = defineCli({
  name: "my-cli",
  version: "1.0.0",
  command: rootCommand,
  plugins: [...observabilityKit],
});
```

### Manifest

Manifests are metadata extracted from definitions. Used for help generation and introspection without accessing runtime logic.

```typescript
cli.manifest; // { name: 'my-cli', /* ... */ }
command.manifest; // { name: 'convert', /* ... */ }
option.manifest; // { name: 'output', /* ... */ }
plugin.manifest; // { name: 'analytics' }
```

### Creation

`createCli` turns definitions into runtime objects. It extracts manifests, builds the command tree, creates plugins, then runs plugin `onInit` hooks (which can mutate the CLI structure).

```typescript
import { createCli, defineRootCommand } from "cheloni";
import { basicPluginKit } from "cheloni/std/core";

const rootCommand = defineRootCommand({
  bequeathOptions: [verboseOption], // Available to all commands
  commands: [
    /* ... */
  ],
});

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  command: rootCommand,
  plugins: [analytics, ...basicPluginKit],
});

// cli.command       — root Command (with nested command tree)
// cli.plugins       — resolved Plugin instances
// cli.manifest      — extracted metadata (name, version, descriptions, ...)
```

**What happens during `createCli`:**

1. Manifest is extracted from the definition (metadata for help/introspection)
2. Root command tree is built recursively (`createCommand` / `createRootCommand`)
3. Plugins are created
4. Plugin `onInit` hooks run — they can modify the CLI structure (e.g. `basicPluginKit` injects deprecation/help/version behavior)

### Execution

`executeCli` runs the CLI: resolves the command from `argv`, parses args, runs plugin pre-hooks, then middleware, then validates and calls the handler.

```typescript
import { executeCli } from "cheloni";

await executeCli({ cli });
// Or with explicit args: await executeCli({ cli, args: ['convert', 'file.png'] });
```

**Execution pipeline:**

1. Command resolved from `argv` by walking the command tree
2. Args parsed into positional values and options (with alias resolution)
3. Plugin `onBeforeCommandExecution` hooks run (unvalidated parsed args; each hook **returns** `execute({ ctx })` or `halt()` to continue or stop)
4. Middleware chain runs on the matched command only (starts from plugin-merged `ctx`)
5. Options and positionals validated (unknown-option policy, bequeath option handlers, then Zod)
6. Command handler runs
7. Plugin `onAfterCommandExecution` hooks run with post-attempt `ctx` (options merged over command context when available; even on error)
8. Plugin `onDestroy` hooks run in `executeCli`’s `finally` block

## Core Concepts

### Commands

Commands define CLI operations. They can have positional arguments, options, subcommands, middleware, and plugins.

```typescript
defineCommand({
  name: "greet",
  paths: ["greet", "g"], // Aliases
  positional: z.string(),
  options: z.object({ loud: z.boolean().optional() }),
  commands: [subcommand], // Nested subcommands
  middleware: [authMiddleware],
  plugins: [telemetryPlugin],
  handler: async ({ positional, options, ctx, command, cli }) => {
    // positional: string
    // options: { loud?: boolean }
    // ctx: Context
    // command: Command
    // cli: Cli
    // Full type inference from Zod schemas
  },
});
```

### Middleware

Middleware runs on the **matched command only** (the leaf command resolved from argv), in array order, before option validation and the handler. Extend context with `return next({ ctx: { ... } })` (deep-merged); always **return** the promise or value from `next()`.

```typescript
import { defineMiddleware } from "cheloni";

const auth = defineMiddleware(async ({ next }) => {
  const user = await authenticate();
  if (!user) throw new Error("Unauthorized");
  return next({
    ctx: {
      user,
    },
  });
});

const logger = defineMiddleware(async ({ command, next }) => {
  console.log(`Running: ${command.manifest.name}`);
  return next();
});

defineCommand({
  middleware: [auth, logger], // runs auth → logger → handler
  handler: async ({ ctx }) => {
    ctx.user; // available from auth middleware
  },
});
```

### Bequeath Options

Bequeath options are inherited by subcommands. When placed on the root command, they are available to all commands. Handlers run after middleware and use `next` / `next({ ctx })` like command middleware; they can short-circuit by calling `return halt()`.

```typescript
defineOption({
  name: "verbose",
  schema: z
    .boolean()
    .optional()
    .meta({ aliases: ["V"] }),
  handler: async ({ value, next }) => {
    return next({ ctx: { verbose: Boolean(value) } });
  },
});
```

### Plugins

Plugins hook into the CLI lifecycle at specific points. They can be applied globally or per-command.

**Lifecycle hooks:**

- `onInit` — runs during `createCli`, can mutate CLI structure
- `onBeforeCommandExecution` — runs after parse, before middleware and validation; **return** `execute({ ctx })` or `halt()`
- `onAfterCommandExecution` — runs after handler attempt with post-attempt `ctx` (even on error)
- `onDestroy` — runs on CLI shutdown

**Use cases:** telemetry, auth, feature flags, service integration, context enrichment, CLI manipulation, cleanup.

**Plugin use cases:**

- **Telemetry**: Report usage or metrics
- **Feature Flags**: Enable/disable features dynamically
- **Auth**: Enforce authentication/authorization
- **Service Integration**: Connect to APIs or external services
- **Context Enrichment**: Add custom data to execution context
- **CLI Manipulation**: Mutate CLI structure at runtime
- **Cleanup**: Release resources after commands

## Standard Library

The standard library (`cheloni/std`) provides ready-to-use components for common CLI features.

### Basic plugin kit

The `basicPluginKit` export (`cheloni/std/core`) is an array of plugins that add deprecation warnings, help and version support, and default error handling:

```typescript
import { basicPluginKit } from "cheloni/std/core";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  plugins: [...basicPluginKit],
});
```

**What it adds:**

- Deprecation warnings — warns when the CLI, a command, or provided args/options are marked deprecated
- `help` command — shows root help or help for a specific command
- `version` command — prints the CLI version
- `--help` / `-h` option — shows help for the current command (short-circuits)
- `--version` / `-v` option — prints version (short-circuits)
- `error-handler` plugin — displays unhandled errors via a CLI-level `onError` hook

**Behavior:** If no root command exists, it creates one with help as the default handler. Otherwise, it injects `help` and `version` subcommands and merges `--version` into root options.

### Individual Plugins

You can also use the plugins individually:

```typescript
import { helpPlugin, versionPlugin } from "cheloni/std";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  plugins: [helpPlugin, versionPlugin],
});
```

**Usage examples:**

```sh
$ my-cli help
$ my-cli help deploy
$ my-cli deploy --help
$ my-cli --version
```

**Output examples:**

```sh
$ my-cli help
my-cli v2.0.0

Commands:
  greet, g    Name to greet
  deploy      Deploy the application

$ my-cli greet --help
Usage: greet <positional> [options]

Options:
  -l, --loud

$ my-cli --version
2.0.0
```

### Individual Components

All components are exported individually for customization:

```typescript
import {
  helpCommand,
  versionCommand,
  helpOption,
  versionOption,
  showHelp,
  showVersion,
  mergeOptionsWith,
  mergeOptionsWithVersion,
} from "cheloni/std";
```

## Complete Example

```typescript
import { defineCommand, defineRootCommand, createCli, executeCli } from "cheloni";
import { basicPluginKit } from "cheloni/std/core";
import z from "zod";

const greet = defineCommand({
  name: "greet",
  paths: ["greet", "g"],
  positional: z.string().meta({ description: "Name to greet" }),
  options: z.object({
    loud: z
      .boolean()
      .optional()
      .meta({ aliases: ["l"] }),
  }),
  handler: async ({ positional, options }) => {
    const msg = `Hello, ${positional}!`;
    console.log(options.loud ? msg.toUpperCase() : msg);
  },
});

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  command: defineRootCommand({ commands: [greet] }),
  plugins: [...basicPluginKit],
});

await executeCli({ cli });
```

```sh
$ my-cli greet Alice --loud
HELLO, ALICE!

$ my-cli g Alice
Hello, Alice!

$ my-cli help
my-cli v1.0.0

Commands:
  greet, g    Name to greet
```
