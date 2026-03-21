# Deprecation warnings

Deprecation warnings are **not emitted by core**. To show warnings at runtime, install the standard library `deprecationPlugin` or spread `basicPluginKit` from `./plugin-kits/basic-kit`.

## Deprecate an entire CLI

Set `deprecated` on your CLI definition, then install the plugin or kit:

```typescript
import { createCli } from "cheloni";
import { basicPluginKit } from "./plugin-kits/basic-kit";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  deprecated: "Use `my-cli2` instead.",
  plugins: [...basicPluginKit],
});
```

## Deprecate a command

Set `deprecated` on the command definition:

```typescript
import { defineCommand, defineRootCommand, createCli } from "cheloni";
import { deprecationPlugin } from "cheloni/std";

const old = defineCommand({
  name: "old",
  deprecated: true, // or a custom message string
});

const cli = await createCli({
  name: "my-cli",
  command: defineRootCommand({ commands: [old] }),
  plugins: [deprecationPlugin],
});
```

## Deprecate an option

Options are Zod schemas; mark them deprecated via schema metadata.

```typescript
import { defineCommand } from "cheloni";
import { deprecationPlugin } from "cheloni/std";
import { z } from "zod";

defineCommand({
  name: "build",
  options: z.object({
    legacy: z.boolean().optional().meta({
      deprecated: "Use `--mode modern` instead.",
    }),
  }),
});
```

Only **provided** options emit warnings (i.e. if the user actually passed `--legacy`).

## Deprecate a positional argument

Positionals are also Zod schemas; mark them deprecated via schema metadata.

```typescript
import { defineCommand } from "cheloni";
import { z } from "zod";

defineCommand({
  name: "convert",
  positional: z.string().meta({
    deprecated: "Use `convert <input> --output <path>` instead.",
  }),
});
```

Only **provided** positionals emit warnings (i.e. if a positional value is present).

## When warnings are emitted

With `deprecationPlugin` installed:

- CLI deprecation is warned during plugin `onInit`
- Command/option/positional deprecations are warned during `onBeforeCommandExecution`

For background, see:

- Core execution: `docs/explanation/how-it-works/core/execution.md`
- Std API: `docs/reference/api/std/index.md`
