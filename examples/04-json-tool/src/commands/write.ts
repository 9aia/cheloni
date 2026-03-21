import { defineCommand } from 'cheloni';
import { flagSchema } from 'cheloni/std/core';
import { pathSchema } from 'cheloni/std/os';
import { jsonDataSchema } from 'cheloni/std/parse';
import fs from 'node:fs/promises';
import z from 'zod';

export const writeCommand = defineCommand({
  name: 'write',
  paths: ['write', 'w'],
  description: 'Write JSON to a file',
  positional: pathSchema.meta({ description: 'Output file path' }),
  options: z
    .object({
      data: jsonDataSchema.optional().meta({ description: 'JSON data to write' }),
      stdin: flagSchema.optional().meta({ description: 'Read JSON from stdin instead of --data' }),
    })
    .refine((o) => Boolean(o.stdin) || o.data !== undefined, {
      message: 'Provide --data or use --stdin',
    }),
  handler: async ({ positional, options }) => {
    const jsonData = options.stdin
      ? jsonDataSchema.parse(Buffer.concat(await collectStdinChunks()).toString('utf8'))
      : options.data!;

    await fs.writeFile(positional, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`✓ Wrote JSON to ${positional}`);
  },
});

async function collectStdinChunks(): Promise<Buffer[]> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return chunks;
}
