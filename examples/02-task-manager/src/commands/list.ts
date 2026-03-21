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
  handler: async ({ options, data }) => {
    const workspace = data.workspace;
    const status = options.status || 'all';
    console.log(`Tasks in ${workspace.project} (${status}):`);
    console.log('  1. Review documentation [pending]');
    console.log('  2. Write tests [pending]');
    console.log('  3. Deploy to staging [completed]');
  },
});
