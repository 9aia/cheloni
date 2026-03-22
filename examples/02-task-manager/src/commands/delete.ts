import { defineCommand } from "cheloni";
import { workspaceMiddleware } from "../middleware/workspace";
import { taskIdPositionalSchema } from "../schemas/task";

export const deleteCommand = defineCommand({
  name: "delete",
  description: "Delete a task",
  positional: taskIdPositionalSchema,
  middleware: [workspaceMiddleware],
  handler: async ({ positional, ctx }) => {
    const workspace = ctx.workspace;
    console.log(`✓ Deleted task #${positional} from ${workspace.projectName}`);
  },
});
