# Defining Positional Arguments

## Best Practices

### Provide Good Metadata

Add metadata to help users understand what the positional argument expects:

```typescript
{
  positional: z.string().meta({ 
    description: 'Path to the JPEG image to convert',
    details: dedent`
      Specify the path to the input JPEG file you wish to convert to PDF.
      Relative and absolute paths are accepted.
    `,
    examples: ['my-cli convert ./images/photo.jpg'],
  })
}
```

### Documentation Guidelines

1. **Be specific**: "Output file path" is better than "Output"
2. **Include examples**: "PDF language (e.g., en-US, es-ES)"
3. **Explain constraints**: "Comma-separated keywords"
4. **Use details for complex arguments**: Provide additional information in `details`
5. **Consistent formatting**: Use similar style across all descriptions
