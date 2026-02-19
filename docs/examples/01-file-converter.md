# Example 1: File Converter CLI

A practical file converter tool demonstrating validation, type-safety and aliases.

```typescript
// cli.ts
#!/usr/bin/env bun
import { createCli, defineCommand, defineRootCommand, executeCli } from 'cheloni';
import { basePluginpack } from 'cheloni/std';
import z from 'zod';
import { prettyOptionSchema, outputOptionSchema, pathSchema } from 'cheloni/std';
import pkg from '../package.json' with { type: 'json' };

const convertCommand = defineCommand({
  name: 'convert',
  paths: ['c', 'conv'],
  description: 'Convert files between formats',
  positional: pathSchema.describe('Input file'),
  options: z.object({
    output: outputOptionSchema,
    format: z.enum(['json', 'yaml', 'toml']).default('json').meta({ aliases: ['f'] }),
    pretty: prettyOptionSchema,
  }),
  handler: async ({ positional, options }) => {
    const output = options.output || positional.replace(/\.[^.]+$/, `.${options.format}`);
    console.log(`Converting ${positional} to ${output} (${options.format})`);
    if (options.pretty) console.log('Pretty printing enabled');
  },
});

const rootCommand = defineRootCommand({
  commands: [convertCommand],
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
$ file-converter convert data.txt --format yaml --pretty
$ file-converter c data.txt -f json -o output.json
$ file-converter convert config.toml -p
```
