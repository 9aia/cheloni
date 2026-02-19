# Example 3: Benchmark Tool

A benchmark tool demonstrating bequeath options (--verbose), positional arguments (the command to run) and a custom plugin (time plugin).

```typescript
// cli.ts
#!/usr/bin/env bun
import { createCli, defineCommand, defineRootCommand, executeCli, defineGlobalOption, definePlugin } from 'cheloni';
import { basePluginpack } from 'cheloni/std';
import z from 'zod';
import pkg from '../package.json' with { type: 'json' };

// Custom time plugin that measures command execution time
const timePlugin = definePlugin({
  name: 'time',
  onPreCommandExecution: async ({ command, context }) => {
    context.startTime = Date.now();
  },
  onAfterCommandExecution: async ({ command, context }) => {
    const startTime = context.startTime as number;
    const duration = Date.now() - startTime;
    const verbose = context.verbose as boolean;
    
    if (verbose) {
      console.log(`\n⏱️  Command executed in ${duration}ms`);
    } else {
      console.log(`\n⏱️  ${duration}ms`);
    }
  },
});

// Verbose option as bequeath option (inherited by all commands)
const verboseOption = defineGlobalOption({
  name: 'verbose',
  schema: z.boolean().optional().meta({ aliases: ['V'] }),
  handler: ({ value, context }) => {
    context.verbose = value === true;
  },
});

// Benchmark command that runs another command
const runCommand = defineCommand({
  name: 'run',
  description: 'Run a command and measure its execution time',
  positional: z.string().describe('Command to execute'),
  options: z.object({
    iterations: z.number().optional().describe('Number of iterations to run'),
  }),
  handler: async ({ positional, options, context }) => {
    const command = positional;
    const iterations = options.iterations || 1;
    const verbose = context.verbose as boolean;
    
    if (verbose) {
      console.log(`Running: ${command}`);
      console.log(`Iterations: ${iterations}`);
    }
    
    // Simulate command execution
    for (let i = 0; i < iterations; i++) {
      if (verbose && iterations > 1) {
        console.log(`\nIteration ${i + 1}/${iterations}:`);
      }
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      
      if (verbose) {
        console.log(`✓ ${command} completed`);
      }
    }
    
    if (verbose) {
      console.log(`\nAll iterations completed`);
    }
  },
});

const rootCommand = defineRootCommand({
  bequeathOptions: [verboseOption],
  commands: [runCommand],
});

const cli = await createCli({
  name: pkg.name,
  version: pkg.version,
  command: rootCommand,
  plugins: [timePlugin],
  pluginpacks: [basePluginpack],
});
await executeCli({ cli });
```

## Usage

```bash
$ benchmark run "npm test"
⏱️  127ms

$ benchmark run "npm test" --verbose
Running: npm test
Iterations: 1
✓ npm test completed
All iterations completed

⏱️  Command executed in 142ms

$ benchmark run "npm test" --iterations 3 --verbose
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