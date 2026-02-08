# Dynamic Options

Use `z.record()` for commands that accept arbitrary options with type constraints.

## Simple Practical Example

Suppose you want to make a command that updates keys in a JSON object from the CLI, accepting arbitrary property names and values.

```typescript
const updateJson = defineCommand({
  options: z.record(z.string(), z.string().max(100)),
  handler: async ({ options }) => {
    // Pretend we load and update someObject with CLI key-value pairs
    const someObject = {}; // In reality, load from a file
    Object.assign(someObject, options);
    console.log('Updated JSON:', someObject);
  },
});
```

Usage:

```sh
my-cli update-json --title="My Project" --author="Alice"
```

This pattern allows flexible key-value updates from the command line, with string validation.
