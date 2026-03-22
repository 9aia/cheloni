import { defineMiddleware } from "cheloni";
import type { Workspace } from "../types";

export const workspaceMiddleware = defineMiddleware(async ({ next }) => {
  const projectName = process.env.PROJECT_NAME || "default";
  const workspace = process.env.WORKSPACE || "personal";

  return await next({
    ctx: {
      workspace: { name: workspace, projectName } as Workspace,
    },
  });
});
