# Defining Positional Arguments

## Best Practices

### Provide Good Metadata

Add metadata to help users understand what the positional argument expects:

```typescript
{
  positional: z.string()
    .describe("Path to the JPEG image to convert")
    .meta({
      name: "file",
      details: dedent`
      Specify the path to the input JPEG file you wish to convert to PDF.
      Relative and absolute paths are accepted.
    `,
      examples: ["my-cli convert ./images/photo.jpg"],
    });
}
```

### Name Your Positional Arguments

Use the `name` meta field to give your positional argument a meaningful display name. This name appears in help output instead of the generic `<positional>` placeholder:

```typescript
{
  // Without name: Usage: my-cli convert <positional> [options]
  // With name:    Usage: my-cli convert <file> [options]
  positional: z.string().describe("Input file path").meta({ name: "file" });
}
```

### Documentation Guidelines

1. **Name your arguments**: `meta({ name: 'file' })` is clearer than the default `<positional>`
2. **Be specific**: "Output file path" is better than "Output"
3. **Include examples**: "PDF language (e.g., en-US, es-ES)"
4. **Explain constraints**: "Comma-separated keywords"
5. **Use details for complex arguments**: Provide additional information in `details`
6. **Consistent formatting**: Use similar style across all descriptions
