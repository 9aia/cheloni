import { defineRootCommand } from 'cheloni';
import { CheloniError } from 'cheloni/utils';
import type { TasksConfig } from '../configs/tasks';
import z from 'zod';

class NoTasksJsonError extends CheloniError {
  constructor(fileName: string) {
    super(`No ${fileName} found. Create a ${fileName} file with your task definitions.`);
  }
}

export default defineRootCommand({
  description: 'Run tasks defined in tasks.json',
  positional: z.string().meta({ description: 'Task name to execute', name: 'task' }),
  handler: async ({ positional, context }) => {
    const taskName = positional;
    const { config, configFile } = context as { config: TasksConfig; configFile?: string };

    if (Object.keys(config).length === 0) {
      throw new NoTasksJsonError(configFile ?? 'tasks.json');
    }

    const taskCommand = config[taskName];

    if (!taskCommand) {
      console.error(`Task "${taskName}" not found in tasks.json`);
      console.error(`Available tasks: ${Object.keys(config).join(', ')}`);
      process.exit(1);
    }

    console.log(`Running task: ${taskName}`);
    console.log(`Command: ${taskCommand}`);
    console.log(`\n✓ Task "${taskName}" completed`);
  },
});
