# Manifest API Reference

The Manifest layer extracts serializable metadata from definitions for introspection, help generation, and tooling.

## Functions

### `getCliManifest(definition)`

Extracts the manifest from a CLI definition.

**Parameters:**
- `definition: CliDefinition` - The CLI definition

**Returns:** `CliManifest`

**Example:**
```typescript
import { defineCli, getCliManifest } from "cheloni";

const definition = defineCli({
  name: "my-cli",
  version: "1.0.0"
});

const manifest = getCliManifest(definition);
```

### `getCommandManifest(command)`

Extracts the manifest from a command definition.

**Parameters:**
- `command: CommandManifest` - The command definition

**Returns:** `CommandManifest`

**Example:**
```typescript
import { defineCommand, getCommandManifest } from "cheloni";

const command = defineCommand({
  name: "build",
  description: "Build the project"
});

const manifest = getCommandManifest(command);
```

### `getRootCommandsManifest(command)`

Extracts the manifest from a root command definition.

**Parameters:**
- `command: RootCommandDefinition` - The root command definition

**Returns:** `RootCommandManifest`

**Example:**
```typescript
import { defineRootCommand, getRootCommandsManifest } from "cheloni";

const rootCommand = defineRootCommand({
  handler: () => {}
});

const manifest = getRootCommandsManifest(rootCommand);
```

### `getPluginManifest(definition)`

Extracts the manifest from a plugin definition.

**Parameters:**
- `definition: PluginDefinition` - The plugin definition

**Returns:** `PluginManifest`

**Example:**
```typescript
import { definePlugin, getPluginManifest } from "cheloni";

const plugin = definePlugin({
  name: "my-plugin"
});

const manifest = getPluginManifest(plugin);
```

### `getOptionManifest(name, schema?)`

Extracts the manifest from an option schema.

**Parameters:**
- `name: string` - The option name
- `schema?: z.ZodTypeAny` - The option schema

**Returns:** `OptionManifest`

**Example:**
```typescript
import { getOptionManifest } from "cheloni";
import { z } from "zod";

const manifest = getOptionManifest(
  "verbose",
  z.boolean().optional()
);
```

### `getOptionsManifest(schema)`

Extracts manifests for all options in a schema object.

**Parameters:**
- `schema: z.ZodTypeAny` - The options schema

**Returns:** `OptionManifest[]`

**Example:**
```typescript
import { getOptionsManifest } from "cheloni";
import { z } from "zod";

const manifest = getOptionsManifest(
  z.object({
    verbose: z.boolean(),
    output: z.string()
  })
);
```

### `getPositionalManifest(schema?)`

Extracts the manifest from a positional schema.

**Parameters:**
- `schema?: z.ZodTypeAny` - The positional schema

**Returns:** `PositionalManifest | undefined`

**Example:**
```typescript
import { getPositionalManifest } from "cheloni";
import { z } from "zod";

const manifest = getPositionalManifest(z.string());
```

### `getPluginsManifest(plugins)`

Extracts manifests for multiple plugins.

**Parameters:**
- `plugins: MaybeArray<PluginDefinition>` - The plugin definitions

**Returns:** `PluginManifest[]`

**Example:**
```typescript
import { definePlugin, getPluginsManifest } from "cheloni";

const plugins = [
  definePlugin({ name: "plugin1" }),
  definePlugin({ name: "plugin2" })
];

const manifests = getPluginsManifest(plugins);
```

## Types

### `CliManifest`

```typescript
interface CliManifest {
  name: string;
  version?: string;
  description?: string;
  details?: string;
  deprecated?: boolean | string;
  command?: CommandManifest;
  globalOptions?: OptionManifest[];
  plugins?: PluginManifest[];
}
```

### `CommandManifest`

```typescript
interface CommandManifest {
  name: string;
  paths?: string[];
  deprecated?: boolean | string;
  description?: string;
  example?: MaybeArray<string>;
  options?: OptionManifest[];
  positional?: PositionalManifest;
  plugins?: PluginManifest[];
  commands?: CommandManifest[];
  details?: string;
}
```

### `RootCommandManifest`

```typescript
interface RootCommandManifest extends CommandManifest {
  name: "root";
}
```

### `PluginManifest`

```typescript
interface PluginManifest {
  name: string;
}
```

### `OptionManifest`

```typescript
interface OptionManifest {
  name: string;
  type: string;
  description?: string;
  deprecated?: boolean | string;
  default?: any;
  required?: boolean;
  alias?: string | string[];
}
```

### `PositionalManifest`

```typescript
interface PositionalManifest {
  type: string;
  description?: string;
  deprecated?: boolean | string;
  required?: boolean;
}
```

## Usage

Manifests are primarily used for:
- **Help Generation** - Generating help text from command structure
- **Introspection** - Inspecting CLI structure programmatically
- **Tooling** - Building IDE support, autocomplete, etc.
- **Documentation** - Generating documentation from CLI definitions
