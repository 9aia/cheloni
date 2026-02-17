# Getting Started

1. Install the package
    ```bash
    bun add cheloni
    ```

2. Code your CLI

```typescript
// main.ts
import { createCli, defineCommand, executeCli } from 'cheloni';
import z from 'zod';

const command = defineCommand({
  name: 'process',
  positional: z.string(),
  options: z.object({
    verbose: z.boolean().optional(),
  }),
  handler: async ({ positional, options }) => {
    console.log(`Processing: ${positional}`);
    if (options.verbose) console.log('Verbose mode');
  },
});

const cli = await createCli({
  name: 'my-cli',
  command,
});

await executeCli({ cli });
```

3. Run your CLI
    ```bash
    bun run main.ts
    ```
