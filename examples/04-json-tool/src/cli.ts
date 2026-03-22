#!/usr/bin/env -S tsx
import { createCli, executeCli } from "cheloni";
import rootCommand from "./commands/__root__";
import { basicPluginKit } from "./plugin-kits/basic-kit";

const cli = await createCli({
  metaUrl: import.meta.url,
  command: rootCommand,
  plugins: [...basicPluginKit],
});

await executeCli({ cli });
