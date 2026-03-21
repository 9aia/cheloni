# Task Manager

A simple task management CLI demonstrating multiple commands and middleware with context sharing.

## Quick Start

```bash
git clone https://github.com/9aia/cheloni.git
cd cheloni/examples/02-task-manager
bun install
bun start [...args]
```

## Usage Examples

```bash
$ export PROJECT_NAME=my-project
$ export WORKSPACE=work
$ bun start add "Review PR" --priority high
$ bun start list
$ bun start complete 1
$ bun start delete 2
```

## Source

### `src/cli.ts`

```typescript
import { createCli, executeCli } from 'cheloni';
import rootCommand from './commands/__root__';
import { basicPluginKit } from './plugin-kits/basic-kit';

const cli = await createCli({
  metaUrl: import.meta.url,
  command: rootCommand,
  plugins: [...basicPluginKit],
});
await executeCli({ cli });
```

### `src/commands/__root__.ts`

```typescript
import { defineRootCommand } from 'cheloni';
import { addCommand } from './add';
import { completeCommand } from './complete';
import { deleteCommand } from './delete';
import { listCommand } from './list';

export default defineRootCommand({
  commands: [addCommand, listCommand, completeCommand, deleteCommand],
});
```

### `src/commands/add.ts`

```typescript
import { defineCommand } from 'cheloni';
import z from 'zod';
import { workspaceMiddleware } from '../middleware/workspace';
import { priorityOptionSchema, taskNamePositionalSchema } from '../schemas/task';

export const addCommand = defineCommand({
  name: 'add',
  description: 'Add a new task',
  positional: taskNamePositionalSchema,
  options: z.object({
    priority: priorityOptionSchema,
  }),
  middleware: [workspaceMiddleware],
  handler: async ({ positional, options, ctx }) => {
    const workspace = ctx.workspace;
    const priority = options.priority || 'medium';
    console.log(`✓ Added task "${positional}" (${priority}) to ${workspace.projectName}`);
  },
});
```

### `src/commands/complete.ts`

```typescript
import { defineCommand } from 'cheloni';
import { workspaceMiddleware } from '../middleware/workspace';
import { taskIdPositionalSchema } from '../schemas/task';

export const completeCommand = defineCommand({
  name: 'complete',
  description: 'Mark a task as completed',
  positional: taskIdPositionalSchema,
  middleware: [workspaceMiddleware],
  handler: async ({ positional, ctx }) => {
    const workspace = ctx.workspace;
    console.log(`✓ Completed task #${positional} in ${workspace.projectName}`);
  },
});
```

### `src/commands/delete.ts`

```typescript
import { defineCommand } from 'cheloni';
import { workspaceMiddleware } from '../middleware/workspace';
import { taskIdPositionalSchema } from '../schemas/task';

export const deleteCommand = defineCommand({
  name: 'delete',
  description: 'Delete a task',
  positional: taskIdPositionalSchema,
  middleware: [workspaceMiddleware],
  handler: async ({ positional, ctx }) => {
    const workspace = ctx.workspace;
    console.log(`✓ Deleted task #${positional} from ${workspace.projectName}`);
  },
});
```

### `src/commands/list.ts`

```typescript
import { defineCommand } from 'cheloni';
import z from 'zod';
import { workspaceMiddleware } from '../middleware/workspace';
import { statusFilterOptionSchema } from '../schemas/task';

export const listCommand = defineCommand({
  name: 'list',
  description: 'List all tasks',
  options: z.object({
    status: statusFilterOptionSchema,
  }),
  middleware: [workspaceMiddleware],
  handler: async ({ options, ctx }) => {
    const workspace = ctx.workspace;
    const status = options.status || 'all';
    console.log(`Tasks in ${workspace.projectName} (${status}):`);
    console.log('  1. Review documentation [pending]');
    console.log('  2. Write tests [pending]');
    console.log('  3. Deploy to staging [completed]');
  },
});
```

### `src/middleware/workspace.ts`

```typescript
import { defineMiddleware } from 'cheloni';
import type { Workspace } from '../types';

export const workspaceMiddleware = defineMiddleware(async ({ next }) => {
  const projectName = process.env.PROJECT_NAME || 'default';
  const workspace = process.env.WORKSPACE || 'personal';

  return await next({
    ctx: {
      workspace: { name: workspace, projectName } as Workspace,
    }
  });
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

### `src/schemas/task.ts`

```typescript
import z from 'zod';

export const priorityOptionSchema = z.enum(['low', 'medium', 'high']).optional().describe('Task priority');

export const statusFilterOptionSchema = z
  .enum(['pending', 'completed', 'all'])
  .optional()
  .describe('Filter by status');

export const taskIdPositionalSchema = z.number().describe('Task ID');
export const taskNamePositionalSchema = z.string().describe('Task name');
```

### `src/types.d.ts`

```typescript
export interface Workspace {
    name: string;
    projectName: string;
}
```
