# Getting Started

An overview of Cheloni's architecture and features. For detailed API reference, see the [Reference Documentation](../reference/index.md).

## Installation

```sh
bun install cheloni
# or your favorite package manager
```

## Architecture

Cheloni follows a four-phase architecture: **Definition** → **Manifest** → **Creation** → **Execution**.

### Definition

Define your CLI structure using `define*` functions. These return plain objects with full type inference — nothing is created or executed yet.

```typescript
import { defineCommand, defineRootCommand, defineGlobalOption, definePlugin, definePack, defineCli } from 'cheloni';
import z from 'zod';

const convert = defineCommand({
  name: 'convert',
  paths: ['convert', 'c'],
  description: 'Convert a file',
  positional: z.string().meta({ description: 'Input file' }),
  options: z.object({
    output: z.string().optional().meta({ alias: 'o', description: 'Output path' }),
    quality: z.number().min(0).max(100).optional(),
  }),
  middleware: [authMiddleware],
  plugin: [telemetryPlugin],
  example: 'my-cli convert image.png --output result.webp',
  throwOnExtrageousOptions: 'throw',
  handler: async ({ positional, options, context, command, cli }) => {
    // positional: string, options: { output?: string, quality?: number }
    if(options.verbose) {
      console.log('Verbose mode is enabled');
    }
  },
});

const root = defineRootCommand({ command: [convert, ...otherCommands] });

const verboseOption = defineGlobalOption({
  name: 'verbose',
  schema: z.boolean().optional().meta({ alias: 'V' }),
});

const tokenOption = defineGlobalOption({
  name: 'token',
  schema: z.string().meta({ alias: 't' }),
  handler: async ({ value, context }) => {
    const token = value;
    const session = await getSession(token);
    if (!session) {
      throw new Error('Unauthorized');
    }
    context.user = session.user;
  },
});

const circuitBreakerOption = defineGlobalOption({
  name: 'circuit-breaker',
  handler: async ({ value, context, halt }) => {
    if (yourConditionToShortCircuitExecution) {
      halt();
    }
  },
});

const analytics = definePlugin({
  name: 'analytics',
  onInit: async ({ cli }) => { /* ... */ },
  onPreCommandExecution: async ({ cli, command }) => { /* ... */ },
  onAfterCommandExecution: async ({ cli, command }) => { /* ... */ },
  onDestroy: async ({ cli }) => { /* ... */ },
});

const pack = definePack({
  name: 'my-pack',
  plugin: [analytics, ...otherPlugins],
});

const cli = defineCli({
  name: 'my-cli',
  version: '1.0.0',
  command: root,
  globalOption: [circuitBreakerOption, ...otherGlobalOptions],
  pack,
});
```

### Manifest

Manifests are metadata extracted from definitions. Used for help generation and introspection without accessing runtime logic.

```typescript
cli.manifest        // { name: 'my-cli', /* ... */ }
command.manifest    // { name: 'convert', /* ... */ }
option.manifest     // { name: 'output', /* ... */ }
plugin.manifest     // { name: 'analytics' }
```

### Creation

`createCli` turns definitions into runtime objects. It extracts manifests, builds the command tree, creates global options and plugins, then runs plugin `onInit` hooks (which can mutate the CLI structure).

```typescript
import { createCli } from 'cheloni';
import { stdPack } from 'cheloni/std';

const cli = await createCli({
  name: 'my-cli',
  version: '1.0.0',
  command: root,
  globalOption: [verboseOption],
  plugin: [analytics],
  // Or use a pack: pack: stdPack,
});

// cli.command       — root Command (with nested command tree)
// cli.plugins       — resolved Plugin instances
// cli.globalOptions — resolved GlobalOption instances
// cli.manifest      — extracted metadata (name, version, descriptions, ...)
```

**What happens during `createCli`:**
1. Manifest is extracted from the definition (metadata for help/introspection)
2. Root command tree is built recursively (`createCommand` / `createRootCommand`)
3. Global options are created
4. Plugins are created
5. Plugin `onInit` hooks run — they can modify the CLI structure (e.g. `stdPack` injects help/version commands)

### Execution

`executeCli` runs the CLI: resolves the command from `argv`, parses args, runs middleware, validates with Zod, and calls the handler.

```typescript
import { executeCli } from 'cheloni';

await executeCli({ cli });
// Or with explicit args: await executeCli({ cli, args: ['convert', 'file.png'] });
```

**Execution pipeline:**
1. Command resolved from `argv` by walking the command tree
2. Args parsed into positional values and options (with alias resolution)
3. Middleware chain runs sequentially
4. Positional and options validated with Zod
5. Plugin `onPreCommandExecution` hooks run
6. Command handler runs
7. Plugin `onAfterCommandExecution` hooks run (even on error)
8. Plugin `onDestroy` hooks run on shutdown

## Core Concepts

### Commands

Commands define CLI operations. They can have positional arguments, options, subcommands, middleware, and plugins.

```typescript
defineCommand({
  name: 'greet',
  paths: ['greet', 'g'], // Aliases
  positional: z.string(),
  options: z.object({ loud: z.boolean().optional() }),
  command: [subcommand], // Nested subcommands
  middleware: [authMiddleware],
  plugin: [telemetryPlugin],
  handler: async ({ positional, options, context, command, cli }) => {
    // positional: string
    // options: { loud?: boolean }
    // context: Context
    // command: Command
    // cli: Cli
    // Full type inference from Zod schemas
  },
});
```

### Middleware

Middleware runs sequentially before the handler. All middleware share a single mutable `context` object.

```typescript
import { defineMiddleware, type Middleware } from 'cheloni';

const auth: Middleware = defineMiddleware(async ({ context, next }) => {
  const user = await authenticate();
  if (!user) throw new Error('Unauthorized');
  context.user = user;
  await next();
});

const logger: Middleware = defineMiddleware(async ({ command, next }) => {
  console.log(`Running: ${command.manifest.name}`);
  await next();
});

defineCommand({
  middleware: [auth, logger], // runs auth → logger → handler
  handler: async ({ context }) => {
    context.user; // available from auth middleware
  },
});
```

### Global Options

Global options are available to all commands. They can short-circuit execution (handler won't run if handler is provided).

```typescript
defineGlobalOption({
  name: 'verbose',
  schema: z.boolean().optional().meta({ alias: 'V' }),
  handler: ({ value, command, cli }) => {
    // Short-circuits — command handler won't run
  },
});
```

### Plugins

Plugins hook into the CLI lifecycle at specific points. They can be applied globally or per-command.

**Lifecycle hooks:**
- `onInit` — runs during `createCli`, can mutate CLI structure
- `onPreCommandExecution` — runs before command handler
- `onAfterCommandExecution` — runs after handler (even on error)
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

### Standard Pack

The `stdPack` automatically adds help and version support:

```typescript
import { stdPack } from 'cheloni/std';

const cli = await createCli({
  name: 'my-cli',
  version: '1.0.0',
  pack: stdPack,
});
```

**What it adds:**
- `help` command — shows root help or help for a specific command
- `version` command — prints the CLI version
- `--help` / `-h` global option — shows help for the current command (short-circuits)
- `--version` / `-v` global option — prints version (short-circuits)

**Behavior:** If no root command exists, it creates one with help as the default handler. Otherwise, it injects `help` and `version` subcommands and merges `--version` into root options.

### Individual Plugins

You can also use the plugins individually:

```typescript
import { helpPlugin, versionPlugin } from 'cheloni/std';

const cli = await createCli({
  name: 'my-cli',
  version: '1.0.0',
  plugin: [helpPlugin, versionPlugin],
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
} from 'cheloni/std';
```

## Complete Example

```typescript
import { defineCommand, defineRootCommand, createCli, executeCli } from 'cheloni';
import { stdPack } from 'cheloni/std';
import z from 'zod';

const greet = defineCommand({
  name: 'greet',
  paths: ['greet', 'g'],
  positional: z.string().meta({ description: 'Name to greet' }),
  options: z.object({
    loud: z.boolean().optional().meta({ alias: 'l' }),
  }),
  handler: async ({ positional, options }) => {
    const msg = `Hello, ${positional}!`;
    console.log(options.loud ? msg.toUpperCase() : msg);
  },
});

const cli = await createCli({
  name: 'my-cli',
  version: '1.0.0',
  command: defineRootCommand({ command: [greet] }),
  pack: stdPack,
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
