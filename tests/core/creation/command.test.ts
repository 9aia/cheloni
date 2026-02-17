import { describe, it, expect } from 'vitest';
import z from 'zod';
import { defineCommand } from '~/core/definition/command';
import { createCommand } from '~/core/creation/command';

describe('createCommand', () => {
  it('creates command from definition', () => {
    const definition = defineCommand({
      name: 'test',
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.definition).toBe(definition);
    expect(command.manifest.name).toBe('test');
  });

  it('includes paths', () => {
    const definition = defineCommand({
      name: 'test',
      paths: ['t', 'test'],
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.paths).toEqual(['t', 'test']);
  });

  it('includes deprecated flag', () => {
    const definition = defineCommand({
      name: 'test',
      deprecated: true,
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.deprecated).toBe(true);
  });

  it('includes deprecated message', () => {
    const definition = defineCommand({
      name: 'test',
      deprecated: 'Use new command',
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.deprecated).toBe('Use new command');
  });

  it('creates manifest with positional', () => {
    const definition = defineCommand({
      name: 'test',
      positional: z.string(),
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.manifest.positional).toBeDefined();
  });

  it('creates manifest with options', () => {
    const definition = defineCommand({
      name: 'test',
      options: z.object({
        verbose: z.boolean(),
      }),
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.manifest.options).toBeDefined();
    expect(command.manifest.options).toHaveLength(1);
  });
});
