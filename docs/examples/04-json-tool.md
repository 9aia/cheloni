# Example 4: JSON Tool

A simple JSON tool demonstrating file I/O, JSON parsing, and multiple commands for reading and writing JSON files.

```typescript
// cli.ts
#!/usr/bin/env bun
import { createCli, defineCommand, defineRootCommand, executeCli } from 'cheloni';
import { pathSchema, prettyOptionSchema, basePluginpack } from 'cheloni/std';
import z from 'zod';
import fs from 'node:fs/promises';
import pkg from '../package.json' with { type: 'json' };

const readCommand = defineCommand({
  name: 'read',
  paths: ['read', 'r'],
  description: 'Read and display JSON from a file',
  positional: pathSchema.describe('JSON file path'),
  options: z.object({
    pretty: prettyOptionSchema,
  }),
  handler: async ({ positional, options }) => {
    try {
      const content = await fs.readFile(positional, 'utf8');
      const json = JSON.parse(content);
      
      if (options.pretty) {
        console.log(JSON.stringify(json, null, 2));
      } else {
        console.log(JSON.stringify(json));
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        console.error(`Error: File "${positional}" not found`);
        process.exit(1);
      } else if (error instanceof SyntaxError) {
        console.error(`Error: Invalid JSON in "${positional}"`);
        process.exit(1);
      } else {
        throw error;
      }
    }
  },
});

const writeCommand = defineCommand({
  name: 'write',
  paths: ['write', 'w'],
  description: 'Write JSON to a file',
  positional: pathSchema.describe('Output file path'),
  options: z.object({
    data: z.string().describe('JSON data to write'),
    stdin: z.boolean().optional().describe('Read JSON from stdin instead of --data'),
  }),
  handler: async ({ positional, options }) => {
    try {
      let jsonData: unknown;
      
      if (options.stdin) {
        // Read from stdin
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk);
        }
        const input = Buffer.concat(chunks).toString('utf8');
        jsonData = JSON.parse(input);
      } else {
        // Parse from --data option
        jsonData = JSON.parse(options.data);
      }
      
      await fs.writeFile(positional, JSON.stringify(jsonData, null, 2), 'utf8');
      console.log(`✓ Wrote JSON to ${positional}`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('Error: Invalid JSON data');
        process.exit(1);
      } else {
        throw error;
      }
    }
  },
});

const rootCommand = defineRootCommand({
  commands: [readCommand, writeCommand],
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

### Reading JSON

```bash
# Read and display JSON file
$ json-tool read data.json

# Pretty print JSON
$ json-tool read data.json --pretty

# Using alias
$ json-tool r config.json -p
```

### Writing JSON

```bash
# Write JSON from command line
$ json-tool write output.json --data '{"name": "test", "value": 42}'

# Write JSON from stdin
$ echo '{"key": "value"}' | json-tool write output.json --stdin

# Using alias
$ json-tool w result.json --data '{"status": "success"}'
```
