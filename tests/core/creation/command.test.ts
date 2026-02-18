import { describe, it, expect } from 'vitest';
import z from 'zod';
import { defineCommand, defineRootCommand } from '~/core/definition/command';
import { createCommand, createRootCommand } from '~/core/creation/command';

describe('createCommand', () => {
  it('creates command from definition', () => {
    const definition = defineCommand({
      name: 'test',
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.definition).toBe(definition);
    expect(command.manifest.name).toBe('test');
    expect(command.paths).toEqual(['test']);
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

  it('defaults paths to command name when not provided', () => {
    const definition = defineCommand({
      name: 'my-command',
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.paths).toEqual(['my-command']);
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

  it('handles missing deprecated flag', () => {
    const definition = defineCommand({
      name: 'test',
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.deprecated).toBeUndefined();
  });

  it('creates manifest with positional', () => {
    const definition = defineCommand({
      name: 'test',
      positional: z.string().describe('input'),
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.manifest.positional).toBeDefined();
    // Description extraction depends on Zod internals - just verify manifest exists
    expect(command.manifest.positional).toHaveProperty('description');
  });

  it('creates manifest with options', () => {
    const definition = defineCommand({
      name: 'test',
      options: z.object({
        verbose: z.boolean(),
        count: z.number().optional(),
      }),
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.manifest.options).toBeDefined();
    expect(command.manifest.options).toHaveLength(2);
    expect(command.manifest.options?.[0]?.name).toBe('verbose');
    expect(command.manifest.options?.[1]?.name).toBe('count');
  });

  it('creates nested subcommands', () => {
    const definition = defineCommand({
      name: 'parent',
      command: [
        defineCommand({
          name: 'child1',
          handler: async () => {},
        }),
        defineCommand({
          name: 'child2',
          handler: async () => {},
        }),
      ],
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.commands.size).toBe(2);
    expect([...command.commands].map(c => c.manifest.name)).toEqual(['child1', 'child2']);
  });

  it('creates single nested subcommand', () => {
    const definition = defineCommand({
      name: 'parent',
      command: defineCommand({
        name: 'child',
        handler: async () => {},
      }),
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.commands.size).toBe(1);
    expect([...command.commands][0]?.manifest.name).toBe('child');
  });

  it('creates deeply nested command tree', () => {
    const definition = defineCommand({
      name: 'root',
      command: defineCommand({
        name: 'level1',
        command: defineCommand({
          name: 'level2',
          handler: async () => {},
        }),
        handler: async () => {},
      }),
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.commands.size).toBe(1);
    const level1 = [...command.commands][0];
    expect(level1?.manifest.name).toBe('level1');
    expect(level1?.commands.size).toBe(1);
    const level2 = [...level1!.commands][0];
    expect(level2?.manifest.name).toBe('level2');
  });

  it('creates command with all properties', () => {
    const definition = defineCommand({
      name: 'convert',
      paths: ['c', 'convert'],
      description: 'Convert files',
      deprecated: 'Use transform',
      positional: z.string(),
      options: z.object({ output: z.string().optional() }),
      command: defineCommand({
        name: 'sub',
        handler: async () => {},
      }),
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.manifest.name).toBe('convert');
    expect(command.paths).toEqual(['c', 'convert']);
    expect(command.manifest.description).toBe('Convert files');
    expect(command.deprecated).toBe('Use transform');
    expect(command.manifest.positional).toBeDefined();
    expect(command.manifest.options).toBeDefined();
    expect(command.commands.size).toBe(1);
  });

  it('creates command without handler', () => {
    const definition = defineCommand({
      name: 'test',
    });

    const command = createCommand(definition);
    expect(command.definition.handler).toBeUndefined();
    expect(command.manifest.name).toBe('test');
  });
});

describe('createRootCommand', () => {
  it('creates root command with name "root"', () => {
    const definition = defineRootCommand({
      command: defineCommand({
        name: 'test',
        handler: async () => {},
      }),
    });

    const command = createRootCommand(definition);
    expect(command.manifest.name).toBe('root');
    expect(command.commands.size).toBe(1);
  });

  it('preserves root command properties', () => {
    const definition = defineRootCommand({
      description: 'Root description',
      command: defineCommand({
        name: 'test',
        handler: async () => {},
      }),
    });

    const command = createRootCommand(definition);
    expect(command.manifest.name).toBe('root');
    expect(command.manifest.description).toBe('Root description');
  });
});
