# Aliases

Aliases let you define alternate names (like short flags) for options or commands.

## Path Aliases

You can define command aliases using the `paths` property. This allows multiple invocations of the same command via different names.

```typescript
const build = defineCommand({
  name: 'build',
  paths: ['build', 'b'], // both 'build' and 'b' will map to this command
  handler: async ({ options }) => {
    // Use 'my-cli build' or 'my-cli b'
  },
});
```

> **Note:** By default, if you don't specify `paths`, it will automatically fallback to `[name]` — meaning the command name is always included as a path.
>
> However, if you **explicitly set** `paths`, the command name is **not** automatically included. You must add it yourself if you still want it to be a valid path.
>
> For example, if you are adding `j` as an alias for a command named `join`:
>
> ```typescript
> // ✅ Correct: includes both the name and the alias
> defineCommand({
>   name: 'join',
>   paths: ['join', 'j'],
>   // ...
> });
>
> // ❌ Wrong: 'join' will NOT be a valid path, only 'j' will work
> defineCommand({
>   name: 'join',
>   paths: ['j'],
>   // ...
> });
> ```
>
> Even though the command `name` is `'join'`, setting `paths: ['j']` means only `j` is a recognized path  (it is overwriting). The `name` field is used for identification and display purposes, while `paths` controls routing exclusively when explicitly set.

## Option Aliases

Option aliases are set using the `alias` property in the Zod metadata for that option.

```typescript
const command = defineCommand({
  options: z.object({
    output: z.string().optional().meta({
      alias: 'o' // Single alias: -o
    }),
    normalize: z.boolean().optional().meta({ 
      alias: ['n', 'c'] // Multiple aliases: -n and --normalize
    }),
  }),
  handler: async ({ options }) => {
    // Accepts --output or -o; --normalize, -n or -c
  },
});
```

## Global Option Aliases

Global option aliases work the same way as regular option aliases — through the **schema's `alias` metadata**. This may feel a little counter-intuitive at first since global options have a `name` and `schema` at the top level, but the alias is defined inside the schema via `.meta()`, not as a top-level property. This is consistent with how all option aliases work in the system.

```typescript
import { defineGlobalOption } from 'cheloni';

export default defineGlobalOption({
  name: 'help',
  schema: z.boolean().meta({ alias: 'h' }), // alias is set on the schema, not directly on the definition
  handler: ({ command, cli }) => {
    renderCommandHelp(cli, command.manifest.name);
  },
});
```

In the example above, `--help` and `-h` will both trigger the global help option. The alias `'h'` is defined via `z.boolean().meta({ alias: 'h' })` on the schema — not as a separate `alias` property on the global option definition itself.

**Notes:**

- The framework automatically includes aliases in error messages where applicable.
- The built-in help command will show all available aliases for each option.
- The framework does not distinguish between `-o` and `--o`, or `-verbose` and `--verbose`; both forms are accepted for any alias.
