import { defineCommand } from 'cheloni';
import z from 'zod';

export const runCommand = defineCommand({
  name: 'run',
  description: 'Run a command and measure its execution time',
  positional: z.string().meta({ description: 'Command to execute' }),
  options: z.object({
    iterations: z.number().optional().meta({ description: 'Number of iterations to run' }),
  }),
  handler: async ({ positional, options, context }) => {
    const command = positional;
    const iterations = options.iterations || 1;
    const verbose = (context as { verbose?: boolean }).verbose === true;

    if (verbose) {
      console.log(`Running: ${command}`);
      console.log(`Iterations: ${iterations}`);
    }

    for (let i = 0; i < iterations; i++) {
      if (verbose && iterations > 1) {
        console.log(`\nIteration ${i + 1}/${iterations}:`);
      }

      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));

      if (verbose) {
        console.log(`✓ ${command} completed`);
      }
    }

    if (verbose) {
      console.log(`\nAll iterations completed`);
    }
  },
});
