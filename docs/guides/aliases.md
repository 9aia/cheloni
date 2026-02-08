# Aliases

Aliases let you define alternate names (like short flags) for options or commands.

## Path Aliases

You can define command aliases using the `paths` property. This allows multiple invocations of the same command via different names.

```typescript
const build = defineCommand({
  paths: ['build', 'b'], // both 'build' and 'b' will map to this command
  handler: async ({ options }) => {
    // Use 'my-cli build' or 'my-cli b'
  },
});
```

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

**Notes:**

- The framework automatically includes aliases in error messages where applicable.
- The built-in help command will show all available aliases for each option.
- The framework does not distinguish between `-o` and `--o`, or `-verbose` and `--verbose`; both forms are accepted for any alias.
