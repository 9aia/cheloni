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
