# Creation API Reference

The Creation layer builds runtime instances from definitions, creating the command tree and initializing plugins.

## Functions

### `createCli(definition)`

Creates a CLI instance from a definition. This function:
- Resolves optional `name`, `version`, and `description` from the nearest `package.json` when `metaUrl` is set (see below)
- Extracts the manifest
- Creates the root command tree
- Creates plugins
- Calls `onInit` hooks for all plugins

**Parameters:**
- `definition: CliDefinition` - The CLI definition

**Returns:** `Promise<Cli>`

**Package metadata:** If `definition.metaUrl` is set (typically `import.meta.url` from your CLI entry file), any of `name`, `version`, or `description` that are omitted are read from the closest `package.json` found by walking parent directories from that module’s path. Omitted fields are not merged if you do not set `metaUrl`. If `name` and `version` are both set explicitly, `package.json` is not read unless `description` is still omitted. Explicit definition values always override `package.json`.

**Example:**
```typescript
import { defineCli, createCli } from "cheloni";

const definition = defineCli({
  name: "my-cli",
  command: { handler: () => {} }
});

const cli = await createCli(definition);
```

**Example (defaults from `package.json`):**
```typescript
import { createCli, defineRootCommand } from "cheloni";

const rootCommand = defineRootCommand({ handler: async () => {} });

const cli = await createCli({
  metaUrl: import.meta.url,
  command: rootCommand,
});
```

### `createCommand(definition)`

Creates a command instance from a definition. Recursively creates child commands.

**Parameters:**
- `definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>` - The command definition

**Returns:** `Command<TPositionalDefinition, TOptionsDefinition>`

**Example:**
```typescript
import { defineCommand, createCommand } from "cheloni";

const definition = defineCommand({
  name: "build",
  handler: () => {}
});

const command = createCommand(definition);
```

### `createRootCommand(definition)`

Creates a root command instance from a definition.

**Parameters:**
- `definition: RootCommandDefinition<TPositionalDefinition, TOptionsDefinition>` - The root command definition

**Returns:** `RootCommand<TPositionalDefinition, TOptionsDefinition>`

**Example:**
```typescript
import { defineRootCommand, createRootCommand } from "cheloni";

const definition = defineRootCommand({
  handler: () => {}
});

const rootCommand = createRootCommand(definition);
```

### `createOption(definition)`

Creates an option runtime object from a definition, attaching the computed manifest.

**Parameters:**
- `definition: OptionDefinition` - The option definition

**Returns:** `Option`

**Example:**
```typescript
import { defineOption, createOption } from "cheloni";
import { z } from "zod";

const definition = defineOption({
  name: "config",
  schema: z.string()
});

const option = createOption(definition);
```

### `createPlugin(definition)`

Creates a plugin instance from a definition.

**Parameters:**
- `definition: PluginDefinition` - The plugin definition

**Returns:** `Plugin`

**Example:**
```typescript
import { definePlugin, createPlugin } from "cheloni";

const definition = definePlugin({
  name: "my-plugin",
  onInit: () => {}
});

const plugin = createPlugin(definition);
```

## Global vs Command Plugins

### Global Plugins

Registered on the CLI definition:

```typescript
const cli = await createCli({
  name: "my-cli",
  plugins: [myPlugin] // or [plugin1, plugin2]
});
```

- Created once during `createCli()`
- Stored in `cli.plugins`
- `onInit` runs during creation
- All hooks run for every command

### Command Plugins

Registered on a command definition:

```typescript
const command = defineCommand({
  name: "build",
  plugins: [myPlugin], // or [plugin1, plugin2]
  handler: () => {}
});
```

- Created on-the-fly during `executeCommand()`
- Never receive `onInit` (only execution hooks)
- Re-created on every run (no shared state)
- Only run for that specific command

## Types

### `Cli`

```typescript
interface Cli {
  manifest: CliManifest;
  command?: RootCommand;
  plugins: ManifestKeyedMap<Plugin>;
}
```

### `Command<TPositionalDefinition, TOptionsDefinition>`

```typescript
interface Command<
  TPositionalDefinition extends PositionalDefinition = any,
  TOptionsDefinition extends OptionSchema = any
> {
  definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>;
  manifest: CommandManifest;
  commands: ManifestKeyedMap<Command>;
  paths: string[];
  bequeathOptions: ManifestKeyedMap<Option>;
  deprecated?: boolean | string;
}
```

### `RootCommand<TPositionalDefinition, TOptionsDefinition>`

```typescript
type RootCommand<
  TPositionalDefinition extends PositionalDefinition = any,
  TOptionsDefinition extends OptionSchema = any
> = Command<TPositionalDefinition, TOptionsDefinition>;
```

### `CommandHandlerParams<TPositionalDefinition, TOptionsDefinition>`

```typescript
interface CommandHandlerParams<
  TPositionalDefinition extends PositionalDefinition,
  TOptionsDefinition extends OptionSchema
> {
  positional: InferPositionalType<TPositionalDefinition>;
  options: InferOptionsType<TOptionsDefinition>;
  ctx: Context;
  command: Command;
  cli: Cli;
}
```

### `CommandHandler<TPositionalDefinition, TOptionsDefinition>`

```typescript
type CommandHandler<
  TPositionalDefinition extends PositionalDefinition,
  TOptionsDefinition extends OptionSchema
> = (params: CommandHandlerParams<TPositionalDefinition, TOptionsDefinition>) => Promisable<void>;
```

### `Option`

Runtime object of an `OptionDefinition`, used in `Command.bequeathOptions`.

```typescript
interface Option {
  definition: OptionDefinition;
  manifest: OptionManifest;
}
```

### `Plugin`

```typescript
interface Plugin {
  definition: PluginDefinition;
  manifest: PluginManifest;
}
```

### `OptionHandlerParams<TSchema>`

```typescript
interface OptionHandlerParams<TSchema extends OptionSchema> {
  value: z.infer<TSchema>;
  option: Option;
  command: Command;
  cli: Cli;
  ctx: Context;
  halt: HaltFunction;
}
```

### `OptionHandler<TSchema>`

```typescript
type OptionHandler<TSchema extends OptionSchema> = (
  params: OptionHandlerParams<TSchema>
) => Promisable<void>;
```

### `Context`

```typescript
type Context = {
  [key: string]: any;
};
```

### `Middleware`

```typescript
type Middleware = (params?: MiddlewareParams) => Promisable<void>;
```

### `MiddlewareFactory<TOptions, TMiddleware>`
A helper type for creating a middleware from some configuration/options.

```typescript
type MiddlewareFactory<
  TOptions extends Record<string, any>,
  TMiddleware extends Middleware = Middleware
> = (options: TOptions) => TMiddleware;
```

### `MiddlewareParams`

```typescript
interface MiddlewareParams {
  command: Command;
  ctx: Context;
  next: NextFunction;
  halt: HaltFunction;
}
```

### `NextFunction`

```typescript
type NextFunction = () => Promise<void>;
```

### `HaltFunction`

```typescript
type HaltFunction = () => never;
```

### `InferOptionsType<TSchema>`

Infers the TypeScript type from an options Zod schema.

```typescript
type InferOptionsType<TSchema extends OptionSchema> =
  [TSchema] extends [OptionSchema] ? z.infer<TSchema> : {};
```

### `InferPositionalType<TSchema>`

Infers the TypeScript type from a positional Zod schema.

```typescript
type InferPositionalType<TSchema extends PositionalSchema> =
  [TSchema] extends [PositionalSchema] ? z.infer<TSchema> : undefined;
```
