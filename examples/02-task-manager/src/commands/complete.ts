import { defineCommand } from 'cheloni';
import { workspaceMiddleware } from '../middleware/workspace';
import { taskIdPositionalSchema } from '../schemas/task';

export const completeCommand = defineCommand({
  name: 'complete',
  description: 'Mark a task as completed',
  positional: taskIdPositionalSchema,
  middleware: [workspaceMiddleware],
  handler: async ({ positional, data }) => {
    const workspace = data.workspace;
    console.log(`✓ Completed task #${positional} in ${workspace.project}`);
  },
});
