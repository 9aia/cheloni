# Example: JSON Tool

A simple JSON tool demonstrating file I/O, JSON parsing, and subcommands for reading and writing JSON files.

## Quick Start

```bash
git clone https://github.com/9aia/cheloni.git
cd cheloni/examples/04-json-tool
bun install
bun start [...args]
```

## Usage Examples

### Reading JSON

```bash
$ bun start read data.json
$ bun start read data.json --pretty
$ bun start r config.json -p
```

### Writing JSON

```bash
$ bun start write output.json --data '{"name": "test", "value": 42}'
$ echo '{"key": "value"}' | bun start write output.json --stdin
$ bun start w result.json --data '{"status": "success"}'
```

## Source

### `src/cli.ts`

```typescript
import { createCli, executeCli } from "cheloni";
import rootCommand from "./commands/__root__";
import { basicPluginKit } from "./plugin-kits/basic-kit";

const cli = await createCli({
  metaUrl: import.meta.url,
  command: rootCommand,
  plugins: [...basicPluginKit],
});

await executeCli({ cli });
```

### `src/commands/__root__.ts`

```typescript
import { defineRootCommand } from "cheloni";
import { readCommand } from "./read";
import { writeCommand } from "./write";

export default defineRootCommand({
  commands: [readCommand, writeCommand],
});
```

### `src/commands/read.ts`

```typescript
import { defineCommand } from "cheloni";
import { pathSchema } from "cheloni/std/os";
import { prettyOptionSchema } from "cheloni/std/ui";
import fs from "node:fs/promises";
import z from "zod";

export const readCommand = defineCommand({
  name: "read",
  paths: ["read", "r"],
  description: "Read and display JSON from a file",
  positional: pathSchema.meta({ description: "JSON file path" }),
  options: z.object({
    pretty: prettyOptionSchema,
  }),
  handler: async ({ positional, options }) => {
    try {
      const content = await fs.readFile(positional, "utf8");
      const json = JSON.parse(content) as unknown;

      if (options.pretty) {
        console.log(JSON.stringify(json, null, 2));
      } else {
        console.log(JSON.stringify(json));
      }
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
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
```

### `src/commands/write.ts`

```typescript
import { defineCommand } from "cheloni";
import { flagSchema } from "cheloni/std/core";
import { pathSchema } from "cheloni/std/os";
import { jsonDataSchema } from "cheloni/std/parse";
import fs from "node:fs/promises";
import z from "zod";

export const writeCommand = defineCommand({
  name: "write",
  paths: ["write", "w"],
  description: "Write JSON to a file",
  positional: pathSchema.meta({ description: "Output file path" }),
  options: z
    .object({
      data: jsonDataSchema.optional().meta({ description: "JSON data to write" }),
      stdin: flagSchema.optional().meta({ description: "Read JSON from stdin instead of --data" }),
    })
    .refine((o) => Boolean(o.stdin) || o.data !== undefined, {
      message: "Provide --data or use --stdin",
    }),
  handler: async ({ positional, options }) => {
    const jsonData = options.stdin
      ? jsonDataSchema.parse(Buffer.concat(await collectStdinChunks()).toString("utf8"))
      : options.data!;

    await fs.writeFile(positional, JSON.stringify(jsonData, null, 2), "utf8");
    console.log(`✓ Wrote JSON to ${positional}`);
  },
});

async function collectStdinChunks(): Promise<Buffer[]> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return chunks;
}
```

### `src/plugin-kits/basic-kit.ts`

```typescript
import { deprecationPlugin, errorHandlerPlugin, helpPlugin, versionPlugin } from "cheloni/std/core";

export const basicPluginKit = [
  errorHandlerPlugin,
  helpPlugin,
  versionPlugin,
  deprecationPlugin,
] as const;
```
