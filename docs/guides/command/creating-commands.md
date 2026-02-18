# Creating Commands

## Command Aliases (Paths)

Define command aliases using the `paths` property. This allows multiple invocations of the same command via different names:

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

## CLI Wrappers

When wrapping another CLI tool, use `throwOnExtrageousOptions: 'pass-through'` to forward unknown options:

```typescript
const build = defineCommand({
  options: z.object({
    // Only define wrapper-specific options
    dryRun: z.boolean().optional().meta({ alias: 'd' }),
  }),
  throwOnExtrageousOptions: 'pass-through', // Pass through unknown options
  handler: async ({ options }) => {
    const { dryRun, ...forwardedOptions } = options;
    
    if (dryRun) {
      console.log('Would run:', forwardedOptions);
      return;
    }
    
    // Forward to underlying tool
    execSync('webpack', [
      ...Object.entries(forwardedOptions).flatMap(([k, v]) => [`--${k}`, String(v)])
    ]);
  },
});
```

Usage: `my-cli build --dry-run --webpack-config webpack.prod.js`

### Pass-Through Options

- `'pass-through'` — Pass through unknown options (for CLI wrappers)
- `'throw'` — Default - block unknown options
- `'filter-out'` — Silently ignore unknown options

### Dynamic Option Validation

```typescript
const run = defineCommand({
  options: z.record(z.string(), z.number()), // Any string keys and number values
  handler: async ({ options }) => {
    // All options are validated as string keys and number values
    // Can forward to tool that accepts arbitrary options
  },
});
```

## Error Handling

Throw `Error` instances in your handler for application failures. The framework automatically displays the error message and exits with a non-zero status code:

```typescript
handler: async ({ positional, options }) => {
  if (!fs.existsSync(positional)) {
    throw new Error(`File not found: ${positional}`);
  }
  
  try {
    await processFile(positional);
  } catch (error) {
    // Re-throw after cleanup if needed
    throw new Error(`Failed to process file: ${error.message}`);
  }
}
```

**Key points:**
- Throw descriptive errors with actionable messages
- Don't manually validate schema-defined inputs (Zod handles this)
- Use try-catch only for cleanup or recovery, then re-throw
- The framework handles error display and exit codes automatically

## Best Practices

### Defining Commands

**Do**: `const command = defineCommand({ ... })` or `export default defineCommand({ ... })`

**Don't**: `const command: Command = { ... }`  

**Why**: Using `defineCommand` gives you type-safe access to values in your handler, making your code safer and developer experience better.

### Provide Global Examples

Provide global examples to help users understand how to use the command:

```typescript
defineCommand({
  // ...
  example: [
    'my-cli convert ./images/photo.jpg',
    'my-cli convert ~/Downloads/photo.jpg --normalize',
  ],
});
```
