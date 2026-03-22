# Example: File Converter

A practical file converter tool demonstrating validation, type-safety, and option aliases.

## Quick Start

```bash
git clone https://github.com/9aia/cheloni.git
cd cheloni/examples/01-file-converter
bun install
bun start [...args]
```

## Usage Examples

```bash
$ bun start convert data.txt --format yaml --pretty
$ bun start c data.txt -f json -o output.json
$ bun start convert config.toml -p
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
import { convertCommand } from "./convert";

export default defineRootCommand({
  commands: [convertCommand],
});
```

### `src/commands/convert.ts`

```typescript
import { defineCommand } from "cheloni";
import { outputOptionSchema, pathSchema } from "cheloni/std/os";
import z from "zod";

export const convertCommand = defineCommand({
  name: "convert",
  paths: ["c", "conv"],
  description: "Convert files between formats",
  positional: pathSchema.meta({ description: "Input file" }),
  options: z.object({
    output: outputOptionSchema,
    format: z
      .enum(["json", "yaml", "toml"])
      .default("json")
      .meta({ aliases: ["f"] }),
  }),
  handler: async ({ positional, options }) => {
    const output = options.output || positional.replace(/\.[^.]+$/, `.${options.format}`);
    console.log(`Converting ${positional} to ${output} (${options.format})`);
  },
});
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
