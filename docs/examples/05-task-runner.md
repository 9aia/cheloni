# Task Runner

A lightweight task runner demonstrating the std config plugin, positional arguments, and accessing configuration in handlers. Plugins are composed with a local **plugin kit** array (same pattern as [`src/cli.ts`](./src/cli.ts)).

## Quick Start

```bash
git clone https://github.com/9aia/cheloni.git
cd cheloni/examples/05-task-runner
bun install
bun start [...args]
```

## Usage Examples

```bash
# Using explicit config file
$ bun start build --config tasks.dev.json
Running task: build
Command: tsc
✓ Task "build" completed

# Using default config file (tasks.json)
$ bun start start
Running task: start
Command: node dist/app.js
✓ Task "start" completed

# Error handling
$ bun start unknown
Task "unknown" not found in tasks.json
Available tasks: build, start, test, lint
```

## Source

### `src/cli.ts`

```typescript
import { createCli, executeCli } from "cheloni";
import { configPlugin } from "cheloni/std/config";
import rootCommand from "./commands/__root__";
import { tasksConfigSchema } from "./configs/tasks";
import { basicPluginKit } from "./plugin-kits/basic-kit";

const cli = await createCli({
  metaUrl: import.meta.url,
  command: rootCommand,
  plugins: [
    ...basicPluginKit,
    configPlugin({
      c12Options: { configFile: "tasks" },
      schema: tasksConfigSchema,
    }),
  ],
});

await executeCli({ cli });
```

### `src/commands/__root__.ts`

```typescript
import { defineRootCommand } from "cheloni";
import { CheloniError } from "cheloni/utils";
import type { TasksConfig } from "../configs/tasks";
import z from "zod";

class NoTasksJsonError extends CheloniError {
  constructor(fileName: string) {
    super(`No ${fileName} found. Create a ${fileName} file with your task definitions.`);
  }
}

export default defineRootCommand({
  description: "Run tasks defined in tasks.json",
  positional: z.string().meta({ description: "Task name to execute", name: "task" }),
  handler: async ({ positional, ctx }) => {
    const taskName = positional;
    const { config, configFile } = ctx as { config: TasksConfig; configFile?: string };

    if (Object.keys(config).length === 0) {
      throw new NoTasksJsonError(configFile ?? "tasks.json");
    }

    const taskCommand = config[taskName];

    if (!taskCommand) {
      console.error(`Task "${taskName}" not found in tasks.json`);
      console.error(`Available tasks: ${Object.keys(config).join(", ")}`);
      process.exit(1);
    }

    console.log(`Running task: ${taskName}`);
    console.log(`Command: ${taskCommand}`);
    console.log(`\n✓ Task "${taskName}" completed`);
  },
});
```

### `src/configs/tasks.ts`

```typescript
import z from "zod";

export const tasksConfigSchema = z.record(z.string(), z.string());
export type TasksConfig = z.infer<typeof tasksConfigSchema>;
```

### `src/plugin-kits/basic-kit.ts`

```typescript
import { deprecationPlugin, errorHandlerPlugin, helpPlugin, versionPlugin } from "cheloni/std/core";

export const basicPluginKit = [
  errorHandlerPlugin,
  helpPlugin,
  versionPlugin,
  deprecationPlugin,
] as const;
```
