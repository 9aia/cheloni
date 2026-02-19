# Defining Options

> For creating global options, see [Creating Global Options](./creating-global-options.md).

## Option Aliases

Option aliases are set using the `aliases` property in the Zod metadata:

```typescript
const command = defineCommand({
  options: z.object({
    output: z.string().optional().meta({
      aliases: ['o'] // Single alias: -o
    }),
    normalize: z.boolean().optional().meta({ 
      aliases: ['n', 'c'] // Multiple aliases: -n and --normalize
    }),
  }),
  handler: async ({ options }) => {
    // Accepts --output or -o; --normalize, -n or -c
  },
});
```

**Notes:**
- Aliases are automatically included in error messages
- The standard library help command shows all available aliases
- Both `-o` and `--o` forms are accepted for any alias

## Advanced Usage

### Dynamic Options

Use `z.record()` to accept arbitrary options with type constraints:

```typescript
const updateJson = defineCommand({
  options: z.record(z.string(), z.string().max(100)),
  handler: async ({ options }) => {
    const someObject = {};
    Object.assign(someObject, options);
    console.log('Updated JSON:', someObject);
  },
});
```

Usage: `my-cli update-json --title="My Project" --author="Alice"`

## Best Practices

### Provide Good Metadata

Provide both `description` (short) and `details` (long) for better help output:

```typescript
{
  options: z.object({
    output: z.string().optional().meta({
      description: 'Output file path',
      aliases: ['o'],
      examples: [
        'my-cli convert ./images/photo.jpg -o ./images/photo.pdf',
        'my-cli convert ~/Downloads/photo.jpg -o ~/Downloads/photo.pdf',
      ]
    }),
    normalize: z.boolean().optional().meta({
      description: 'Normalize the filename',
      details: dedent`
        Normalize the filename by removing diacritical marks,
        replacing special characters with underscores, and
        collapsing multiple underscores.
      `,
      aliases: ['n'],
      examples: ['my-cli convert ~/Downloads/photo.jpg -n'],
    }),
  })
}
```

### Documentation Guidelines

1. **Be specific**: "Output file path" is better than "Output"
2. **Include examples**: "PDF language (e.g., en-US, es-ES)"
3. **Explain constraints**: "Comma-separated keywords"
4. **Use details for complex options**: Provide additional information in `details`
5. **Consistent formatting**: Use similar style across all descriptions
