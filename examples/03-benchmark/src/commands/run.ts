import { defineCommand } from "cheloni";
import z from "zod";

export const runCommand = defineCommand({
  name: "run",
  description: "Run a command and measure its execution time",
  positional: z.string().meta({ description: "Command to execute" }),
  options: z.object({
    iterations: z.number().optional().meta({ description: "Number of iterations to run" }),
  }),
  handler: async ({ positional, options }) => {
    const command = positional;
    const iterations = options.iterations || 1;

    console.log(`Running: ${command}`);
    console.log(`Iterations: ${iterations}`);

    for (let i = 0; i < iterations; i++) {
      if (iterations > 1) {
        console.log(`\nIteration ${i + 1}/${iterations}:`);
      }

      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));

      console.log(`✓ ${command} completed`);
    }

    console.log(`\nAll iterations completed`);
  },
});
