# Creation API Reference

The Creation layer builds runtime instances from definitions, creating the command tree and initializing plugins.

## Functions

### `createCli(definition)`

Creates a CLI instance from a definition. This function:
- Extracts the manifest
- Creates the root command tree
- Creates global options
- Creates plugins
- Calls `onInit` hooks for all plugins

**Parameters:**
- `definition: CliDefinition` - The CLI definition

**Returns:** `Promise<Cli>`

**Example:**
```typescript
import { defineCli, createCli } from "cheloni";

const definition = defineCli({
  name: "my-cli",
  command: { handler: () => {} }
});

const cli = await createCli(definition);
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

### `createGlobalOption(definition)`

Creates a global option instance from a definition.

**Parameters:**
- `definition: GlobalOptionDefinition<TSchema>` - The global option definition

**Returns:** `GlobalOption<TSchema>`

**Example:**
```typescript
import { defineGlobalOption, createGlobalOption } from "cheloni";
import { z } from "zod";

const definition = defineGlobalOption({
  name: "config",
  schema: z.string()
});

const globalOption = createGlobalOption(definition);
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
  TOptionsDefinition extends OptionDefinition = any
> {
  definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>;
  manifest: CommandManifest;
  commands: ManifestKeyedMap<Command>;
  paths: string[];
  deprecated?: boolean | string;
}
```

### `RootCommand<TPositionalDefinition, TOptionsDefinition>`

```typescript
type RootCommand<
  TPositionalDefinition extends PositionalDefinition = any,
  TOptionsDefinition extends OptionDefinition = any
> = Command<TPositionalDefinition, TOptionsDefinition>;
```

### `CommandHandlerParams<TPositionalDefinition, TOptionsDefinition>`

```typescript
interface CommandHandlerParams<
  TPositionalDefinition extends PositionalDefinition,
  TOptionsDefinition extends OptionDefinition
> {
  positional: InferPositionalType<TPositionalDefinition>;
  options: InferOptionsType<TOptionsDefinition>;
  context: Context;
  command: Command;
  cli: Cli;
}
```

### `CommandHandler<TPositionalDefinition, TOptionsDefinition>`

```typescript
type CommandHandler<
  TPositionalDefinition extends PositionalDefinition,
  TOptionsDefinition extends OptionDefinition
> = (params: CommandHandlerParams<TPositionalDefinition, TOptionsDefinition>) => Promisable<void>;
```

### `GlobalOption<TSchema>`

```typescript
interface GlobalOption<TSchema extends z.ZodTypeAny> {
  definition: GlobalOptionDefinition<TSchema>;
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
interface OptionHandlerParams<TSchema extends z.ZodTypeAny> {
  value: z.infer<TSchema>;
  option: Option<TSchema>;
  command: Command;
  cli: Cli;
  context: Context;
  halt: HaltFunction;
}
```

### `OptionHandler<TSchema>`

```typescript
type OptionHandler<TSchema extends z.ZodTypeAny> = (
  params: OptionHandlerParams<TSchema>
) => Promisable<void>;
```

### `Option<TSchema>`

```typescript
interface Option<TSchema extends z.ZodTypeAny> {
  name: string;
  schema: TSchema;
  handler?: OptionHandler<TSchema>;
}
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

### `MiddlewareParams`

```typescript
interface MiddlewareParams {
  command: Command;
  context: Context;
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
type InferOptionsType<TSchema extends z.ZodTypeAny | undefined> =
  [TSchema] extends [z.ZodTypeAny] ? z.infer<TSchema> : {};
```

### `InferPositionalType<TSchema>`

Infers the TypeScript type from a positional Zod schema.

```typescript
type InferPositionalType<TSchema extends z.ZodTypeAny | undefined> =
  [TSchema] extends [z.ZodTypeAny] ? z.infer<TSchema> : undefined;
```
