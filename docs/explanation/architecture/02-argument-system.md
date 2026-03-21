# Arguments in Cheloni (Cheat-Sheet)

Use this as a quick "how to" for implementing arguments in Cheloni commands.

## 1) Positional Arguments

### Basic Typing

```ts
defineCommand({
  name: "add",
  positional: z.coerce.number().meta({ name: "number" }),
  handler: ({ positional }) => {
    // positional: number
  },
});
```

Usage:
- `my-cli add 42`

### Required vs Optional

#### Required positional

```ts
defineCommand({
  name: "deploy",
  positional: z.string().meta({
    name: "environment",
    description: "Environment name (dev, staging, prod)",
  }),
  handler: ({ positional }) => {
    // positional: string
  },
});
```

Usage:
- `my-cli deploy prod`

#### Optional positional

```ts
defineCommand({
  name: "show",
  positional: z.string().optional().meta({ name: "id" }),
  handler: ({ positional }) => {
    // positional is string | undefined
  },
});
```

Usage:
- `my-cli show`
- `my-cli show 42`

### Ordered Values

```ts
defineCommand({
  name: "show",
  positional: z.array(z.string()).meta({ name: "scripts" }),
  handler: ({ positional }) => {
    // positional: string[]
  },
});
```

## 2) Flags / Options

### Long vs Short Forms

```ts
defineCommand({
  name: "dev",
  options: z.object({
    watch: z.boolean().meta({ shorts: ["w"] }),
  }),
});
```

Usage:
- `my-cli dev --watch`
- `my-cli dev -w`

### Multiple Long Aliases

```ts
defineCommand({
  name: "run",
  options: z.object({
    silent: z.boolean().meta({ aliases: ["quiet"] }),
  }),
});
```

Usage:
- `my-cli run --silent`
- `my-cli run --quiet`

### Boolean flags (`--watch`, `-w`)

```ts
defineCommand({
  name: "run",
  options: z.object({
    watch: z.boolean().default(true).meta({
      aliases: ["w"],
      description: "Re-run when files change",
    }),
  }),
  handler: ({ options }) => {
    // options.watch is boolean
    console.log("Watch mode:", options.watch);
  },
});
```

Usage:
- `my-cli run --watch`
- `my-cli run -w`

### Key-value flags (`--port 3000`)

```ts
const serve = defineCommand({
  name: "serve",
  options: z.object({
    port: z.number().default(3000),
    host: z.string().default("127.0.0.1"),
  }),
  handler: ({ options }) => {
    console.log(`Listening on ${options.host}:${options.port}`);
  },
});
```

Usage:
- `my-cli serve --port 3000`
- `my-cli serve --host 0.0.0.0 --port 8080`

## 3) Required vs Optional + Basic Typing

```ts
const build = defineCommand({
  name: "build",
  options: z.object({
    input: z.string(),                 // required string
    retries: z.number().default(3),    // number with default
    minify: z.boolean().default(false) // boolean with default
  }),
  handler: ({ options }) => {
    // options.input: string
    // options.retries: number
    // options.minify: boolean
  },
});
```

## 4) Default Values

Define defaults directly in Zod. Cheloni returns the parsed value with defaults applied.

```ts
const publish = defineCommand({
  name: "publish",
  options: z.object({
    tag: z.string().default("latest"),
    access: z.enum(["public", "restricted"]).default("public"),
  }),
  handler: ({ options }) => {
    console.log(options.tag, options.access);
  },
});
```

## 5) Parsing + Coercion + Validation (What Cheloni does)

- Cheloni parses argv into:
  - `positional: string[]`
  - `options: Record<string, unknown>`
- Alias resolution is automatic from `meta({ aliases: [...] })`.
- Values are then validated with your Zod schemas.
- Validation errors are raised as:
  - `InvalidPositionalError`
  - `InvalidOptionsError`

### Unknown options behavior

By default, unknown options throw. You can change it per command:

```ts
const run = defineCommand({
  name: "run",
  throwOnExtrageousOptions: "filter-out", // "throw" | "filter-out" | "pass-through"
  options: z.object({
    dryRun: z.boolean().default(false),
  }),
  handler: ({ options }) => {
    console.log(options);
  },
});
```
