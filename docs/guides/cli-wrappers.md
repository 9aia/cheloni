# Building CLI Wrappers

When wrapping another CLI tool, you often need to forward options. Use `throwOnExtrageousOptions: 'pass-through'` to pass through unknown options.

## Forwarding All Options

```typescript
const build = defineCommand({
  options: z.object({
    // Only define wrapper-specific options
    dryRun: z.boolean().optional().meta({ alias: 'd' }),
  }),
  throwOnExtrageousOptions: 'pass-through', // Pass through unknown options
  handler: async ({ options }) => {
    // options contains both defined and extra options
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

Usage: `my-cli build --dry-run --webpack-config=webpack.prod.js`

## Strict Wrapper (Block Unknown Options)

```typescript
const deploy = defineCommand({
  options: z.object({
    env: z.enum(['prod', 'staging']),
    region: z.string(),
  }),
  throwOnExtrageousOptions: 'throw', // Default - block unknown options
  handler: async ({ options }) => {
    // Command will fail if any unknown option is provided (only 'env' and 'region' are accepted)
    // Only defined options are present
  },
});
```

Use when wrapper options might conflict with underlying tool options.

## Silently Ignore Extra Options

```typescript
const process = defineCommand({
  options: z.object({
    verbose: z.boolean().optional().meta({ alias: 'v' }),
  }),
  throwOnExtrageousOptions: 'filter-out', // Silently ignore unknown options
  handler: async ({ options }) => {
    // Only defined options are present (extra options are discarded)
    // Useful when extras are harmless but you don't need to forward them
  },
});
```

Use when extra options are harmless noise or future-proofing, but you don't need to forward them to an underlying tool.

## Dynamic Option Validation

```typescript
const run = defineCommand({
  options: z.record(z.string(), z.number()), // Any string keys and number values
  throwOnExtrageousOptions: 'pass-through',
  handler: async ({ options }) => {
    // All options are validated as string keys and number values
    // Can forward to tool that accepts arbitrary options
  },
});
```
