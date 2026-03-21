# Example: Benchmark

A benchmark tool demonstrating bequeath options (`--verbose`), a positional argument (the command to run), and a custom timing plugin.

## Quick Start

```bash
git clone https://github.com/9aia/cheloni.git
cd cheloni/examples/03-benchmark
bun install
bun start [...args]
```

## Usage Examples

```bash
$ bun start run "npm test"
⏱️  127ms

$ bun start run "npm test" --verbose
Running: npm test
Iterations: 1
✓ npm test completed
All iterations completed

⏱️  Command executed in 142ms

$ bun start run "npm test" --iterations 3 --verbose
Running: npm test
Iterations: 3

Iteration 1/3:
✓ npm test completed

Iteration 2/3:
✓ npm test completed

Iteration 3/3:
✓ npm test completed

All iterations completed

⏱️  Command executed in 387ms
```

## Source

### `src/cli.ts`

```typescript
import { createCli, executeCli } from 'cheloni';
import rootCommand from './commands/__root__';
import { basicPluginKit } from './plugin-kits/basic-kit';
import timePlugin from './plugins/time';

const cli = await createCli({
  metaUrl: import.meta.url,
  command: rootCommand,
  plugins: [...basicPluginKit, timePlugin],
});

await executeCli({ cli });
```

### `src/commands/__root__.ts`

```typescript
import { defineRootCommand } from 'cheloni';
import { runCommand } from './run';

export default defineRootCommand({
  commands: [runCommand],
});
```

### `src/commands/run.ts`

```typescript
import { defineCommand } from 'cheloni';
import z from 'zod';

export const runCommand = defineCommand({
  name: 'run',
  description: 'Run a command and measure its execution time',
  positional: z.string().meta({ description: 'Command to execute' }),
  options: z.object({
    iterations: z.number().optional().meta({ description: 'Number of iterations to run' }),
  }),
  handler: async ({ positional, options }) => {
    const command = positional;
    const iterations = options.iterations || 1;

    console.log(`Running: ${command}`);
    console.log(`Iterations: ${iterations}`);

    for (let i = 0; i < iterations; i++) {
      if (iterations > 1) {
        console.log(`\nIteration ${i + 1}/${iterations}:`);
      }

      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));

      console.log(`✓ ${command} completed`);
    }

    console.log(`\nAll iterations completed`);
  },
});
```

### `src/plugin-kits/basic-kit.ts`

```typescript
import { deprecationPlugin, errorHandlerPlugin, helpPlugin, versionPlugin } from 'cheloni/std/core';

export const basicPluginKit = [
  errorHandlerPlugin,
  helpPlugin,
  versionPlugin,
  deprecationPlugin,
] as const;
```

### `src/plugins/time.ts`

```typescript
import { definePlugin } from 'cheloni';

export default definePlugin({
  name: 'time',
  onBeforeCommandExecution: async ({ execute }) => {
    return await execute({
      ctx: {
        startTime: Date.now(),
      },
    });
  },
  onAfterCommandExecution: async ({ data }) => {
    const startTime = data.startTime;
    if (startTime === undefined) return;
    const duration = Date.now() - startTime;
    const verbose = data.verbose === true;

    if (verbose) {
      console.log(`\n⏱️  Command executed in ${duration}ms`);
    } else {
      console.log(`\n⏱️  ${duration}ms`);
    }
  },
});
```
