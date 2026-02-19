# Example 2: Task Manager

A simple task management CLI demonstrating multiple commands and middleware with context sharing.

```typescript
// cli.ts
#!/usr/bin/env bun
import { createCli, defineCommand, defineRootCommand, executeCli, type Middleware } from 'cheloni';
import { basePluginpack } from 'cheloni/std';
import z from 'zod';
import pkg from '../package.json' with { type: 'json' };

interface Workspace {
  name: string;
  project: string;
}

const workspaceMiddleware: Middleware = async ({ context, next }) => {
  const project = process.env.PROJECT_NAME || 'default';
  const workspace = process.env.WORKSPACE || 'personal';
  
  context.workspace = { name: workspace, project };
  await next();
};

const taskId = z.number().describe('Task ID');

const addCommand = defineCommand({
  name: 'add',
  description: 'Add a new task',
  positional: z.string().describe('Task name'),
  options: z.object({
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
  }),
  middleware: [workspaceMiddleware],
  handler: async ({ positional, options, context }) => {
    const workspace = context.workspace;
    const priority = options.priority || 'medium';
    console.log(`✓ Added task "${positional}" (${priority}) to ${workspace.project}`);
  },
});

const listCommand = defineCommand({
  name: 'list',
  description: 'List all tasks',
  options: z.object({
    status: z.enum(['pending', 'completed', 'all']).optional().describe('Filter by status'),
  }),
  middleware: [workspaceMiddleware],
  handler: async ({ options, context }) => {
    const workspace = context.workspace;
    const status = options.status || 'all';
    console.log(`Tasks in ${workspace.project} (${status}):`);
    console.log('  1. Review documentation [pending]');
    console.log('  2. Write tests [pending]');
    console.log('  3. Deploy to staging [completed]');
  },
});

const completeCommand = defineCommand({
  name: 'complete',
  description: 'Mark a task as completed',
  positional: taskId,
  middleware: [workspaceMiddleware],
  handler: async ({ positional, context }) => {
    const workspace = context.workspace;
    console.log(`✓ Completed task #${positional} in ${workspace.project}`);
  },
});

const deleteCommand = defineCommand({
  name: 'delete',
  description: 'Delete a task',
  positional: taskId,
  middleware: [workspaceMiddleware],
  handler: async ({ positional, context }) => {
    const workspace = context.workspace;
    console.log(`✓ Deleted task #${positional} from ${workspace.project}`);
  },
});

const rootCommand = defineRootCommand({
  commands: [addCommand, listCommand, completeCommand, deleteCommand],
});

const cli = await createCli({
  name: pkg.name,
  version: pkg.version,
  command: rootCommand,
  pluginpacks: [basePluginpack],
});
await executeCli({ cli });
```

## Usage

```bash
$ export PROJECT_NAME=my-project
$ export WORKSPACE=work
$ task-manager add "Review PR" --priority high
$ task-manager list
$ task-manager complete 1
$ task-manager delete 2
```
