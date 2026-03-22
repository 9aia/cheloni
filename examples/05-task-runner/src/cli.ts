#!/usr/bin/env bun
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
