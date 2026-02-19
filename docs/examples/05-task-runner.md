# Example 5: Task Runner

A lightweight task runner demonstrating the std config plugin, positional arguments, and accessing configuration in handlers.

```typescript
// cli.ts
#!/usr/bin/env bun
import { createCli, defineRootCommand, executeCli } from 'cheloni';
import { basePluginpack, configPlugin } from 'cheloni/std';
import z from 'zod';
import pkg from '../package.json' with { type: 'json' };

const tasksConfigSchema = z.record(z.string(), z.string());

const rootCommand = defineRootCommand({
  description: 'Run tasks defined in tasks.json',
  positional: z.string().describe('Task name to execute'),
  handler: async ({ positional, context }) => {
    const taskName = positional;
    const config = context.config as TasksConfig | undefined;
    
    if (!config) {
      console.error('No tasks.json found. Create a tasks.json file with your task definitions.');
      process.exit(1);
    }
    
    const taskCommand = config[taskName];
    
    if (!taskCommand) {
      console.error(`Task "${taskName}" not found in tasks.json`);
      console.error(`Available tasks: ${Object.keys(config).join(', ')}`);
      process.exit(1);
    }
    
    console.log(`Running task: ${taskName}`);
    console.log(`Command: ${taskCommand}`);
    console.log(`\n✓ Task "${taskName}" completed`);
  },
});

const cli = await createCli({
  name: pkg.name,
  version: pkg.version,
  command: rootCommand,
  plugins: [configPlugin({
    defaultFilename: 'tasks.json',
    schema: tasksConfigSchema,
  })],
  pluginpacks: [basePluginpack],
});
await executeCli({ cli });
```

## Usage

Create a `tasks.json` file:

```json
{
  "build": "tsc",
  "start": "node dist/app.js",
  "test": "bun test",
  "lint": "eslint src"
}
```

Run tasks:

```bash
# Using explicit config file
$ task build --config tasks.dev.json
Running task: build
Command: tsc
✓ Task "build" completed

# Using default config file (tasks.json)
$ task start
Running task: start
Command: node dist/app.js
✓ Task "start" completed

# Error handling
$ task unknown
Task "unknown" not found in tasks.json
Available tasks: build, start, test, lint
```
