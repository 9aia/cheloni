# Overview

Type-safe, ESM-only, opinionated, schema-based CLI framework with full TypeScript inference. Define commands with Zod schemas and get automatic validation, type safety, and help generation out of the box.

## Quick Example

```typescript
import { defineCommand, createCli, executeCli } from 'cheloni';
import { standardPlugin } from 'cheloni/plugins';
import z from 'zod';

const convert = defineCommand({
  name: 'convert',
  paths: ['convert', 'c'], // Command aliases
  positional: z.string().meta({ description: 'Input file path' }),
  options: z.object({
    output: z.string().optional().meta({ 
      description: 'Output path', 
      alias: 'o' // Option alias: -o or --output
    }),
    quality: z.number().min(0).max(100).optional(),
  }),
  handler: async ({ positional, options }) => {
    // Full type inference: positional is string, options is { output?: string, quality?: number }
    console.log(`Converting ${positional}...`);
  },
});

const cli = await createCli({
  name: 'my-cli',
  version: '1.0.0',
  command: convert,
  plugin: standardPlugin // Adds built-in help & version commands
});

await executeCli({ cli });
```

## Core Features

### Type Safety
- ✅ **Full TypeScript inference** from Zod schemas
- ✅ Types automatically inferred for `positional` and `options` in handlers
- ✅ Compile-time safety for all command definitions

### Command Definition
- **Positional args**: Single argument via Zod schema
- **Options**: Fixed options with `z.object()` or dynamic with `z.record()`
- **Command aliases**: Multiple command paths (`paths: ['build', 'b']`)
- **Option aliases**: Short flags via metadata (`alias: 'o'` or `alias: ['o', 'out']`)
- **Metadata**: Descriptions, details, examples via `.meta()`
- **Deprecation**: Mark as deprecated (`deprecated: true` or `deprecated: 'Use X instead'`)

### Validation & Error Handling
- ✅ **Automatic Zod validation** for all inputs
- ✅ **Context-aware error messages** with field names and descriptions
- ✅ **Unknown option control**: `throwOnExtrageousOptions` with `'throw'` (default, reject unknown options), `'filter-out'` (silently ignore unknown options), or `'pass-through'` (forward unknown options to the handler)

### Execution Pipeline
- ✅ **Middleware**: Pre-handler hooks with `next()` pattern for auth, logging, etc.
- ✅ **Plugins**: Lifecycle hooks (`onInit`, `onBeforeCommand`, `onAfterCommand`, `onDestroy`)
- ✅ **Command-specific plugins**: Per-command plugin configuration

### Built-in Features
- ✅ **Help command**: Auto-generated from metadata (`my-cli help`, `my-cli <command> --help`)
- ✅ **Version command**: Auto-generated from CLI version
- ✅ **Global options**: Shared across all commands
- ✅ **Plugins**: Applied globally to all commands

## Learn More

- [Pipeline](./pipeline.md) - Middleware and execution flow
- [Plugin System](./plugin.md) - Lifecycle hooks and extensibility
- [Error Handling](./error-handling.md) - Automatic error handling
- [Advanced Features](./advanced-features.md) - Aliases, dynamic options, CLI wrappers
