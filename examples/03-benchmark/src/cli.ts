#!/usr/bin/env bun
import { createCli, executeCli } from 'cheloni';
import rootCommand from './commands/__root__';
import { basicPluginKit } from './plugin-kits/basic-kit';
import timePlugin from './plugins/time';

const cli = await createCli({
  metaUrl: import.meta.url,
  command: rootCommand,
  plugins: [...basicPluginKit, timePlugin],
});

await executeCli({ cli });
