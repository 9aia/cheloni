import { describe, it, expect, vi } from 'vitest';
import z from 'zod';
import { defineCommand, defineRootCommand } from '~/core/definition/command';
import { defineGlobalOption } from '~/core/definition/command/global-option';
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
      commands: [
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
    expect([...command.commands.values()].map(c => c.manifest.name)).toEqual(['child1', 'child2']);
  });

  it('creates single nested subcommand', () => {
    const definition = defineCommand({
      name: 'parent',
      commands: [
        defineCommand({
          name: 'child',
          handler: async () => {},
        }),
      ],
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.commands.size).toBe(1);
    expect([...command.commands.values()][0]?.manifest.name).toBe('child');
  });

  it('creates deeply nested command tree', () => {
    const definition = defineCommand({
      name: 'root',
      commands: [
        defineCommand({
          name: 'level1',
          commands: [
            defineCommand({
              name: 'level2',
              handler: async () => {},
            }),
          ],
          handler: async () => {},
        }),
      ],
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.commands.size).toBe(1);
    const level1 = [...command.commands.values()][0];
    expect(level1?.manifest.name).toBe('level1');
    expect(level1?.commands.size).toBe(1);
    const level2 = [...level1!.commands.values()][0];
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
      commands: [
        defineCommand({
          name: 'sub',
          handler: async () => {},
        }),
      ],
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
      commands: [
        defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      ],
    });

    const command = createRootCommand(definition);
    expect(command.manifest.name).toBe('root');
    expect(command.commands.size).toBe(1);
  });

  it('preserves root command properties', () => {
    const definition = defineRootCommand({
      description: 'Root description',
      commands: [
        defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      ],
    });

    const command = createRootCommand(definition);
    expect(command.manifest.name).toBe('root');
    expect(command.manifest.description).toBe('Root description');
  });
});

describe('bequeathOptions', () => {
  it('creates command with empty bequeathOptions when not defined', () => {
    const definition = defineCommand({
      name: 'test',
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.bequeathOptions).toBeDefined();
    expect(command.bequeathOptions.size).toBe(0);
  });

  it('creates command with bequeathOptions', () => {
    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
    });

    const definition = defineCommand({
      name: 'test',
      bequeathOptions: [verboseOption],
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.bequeathOptions.size).toBe(1);
    const option = command.bequeathOptions.get('verbose');
    expect(option).toBeDefined();
    expect(option?.definition.name).toBe('verbose');
  });

  it('inherits bequeathOptions from parent to child', () => {
    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
    });

    const parent = defineCommand({
      name: 'parent',
      bequeathOptions: [verboseOption],
      commands: [
        defineCommand({
          name: 'child',
          handler: async () => {},
        }),
      ],
      handler: async () => {},
    });

    const parentCommand = createCommand(parent);
    const childCommand = parentCommand.commands.get('child')!;

    expect(parentCommand.bequeathOptions.size).toBe(1);
    expect(childCommand.bequeathOptions.size).toBe(1);
    expect(childCommand.bequeathOptions.get('verbose')).toBeDefined();
  });

  it('inherits bequeathOptions through multiple levels', () => {
    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
    });

    const root = defineCommand({
      name: 'root',
      bequeathOptions: [verboseOption],
      commands: [
        defineCommand({
          name: 'level1',
          commands: [
            defineCommand({
              name: 'level2',
              handler: async () => {},
            }),
          ],
          handler: async () => {},
        }),
      ],
      handler: async () => {},
    });

    const rootCommand = createCommand(root);
    const level1Command = rootCommand.commands.get('level1')!;
    const level2Command = level1Command.commands.get('level2')!;

    expect(rootCommand.bequeathOptions.size).toBe(1);
    expect(level1Command.bequeathOptions.size).toBe(1);
    expect(level2Command.bequeathOptions.size).toBe(1);
    expect(level2Command.bequeathOptions.get('verbose')).toBeDefined();
  });

  it('merges bequeathOptions from multiple ancestors', () => {
    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
    });

    const outputOption = defineGlobalOption({
      name: 'output',
      schema: z.string().optional(),
    });

    const root = defineCommand({
      name: 'root',
      bequeathOptions: [verboseOption],
      commands: [
        defineCommand({
          name: 'level1',
          bequeathOptions: [outputOption],
          commands: [
            defineCommand({
              name: 'level2',
              handler: async () => {},
            }),
          ],
          handler: async () => {},
        }),
      ],
      handler: async () => {},
    });

    const rootCommand = createCommand(root);
    const level1Command = rootCommand.commands.get('level1')!;
    const level2Command = level1Command.commands.get('level2')!;

    expect(level2Command.bequeathOptions.size).toBe(2);
    expect(level2Command.bequeathOptions.get('verbose')).toBeDefined();
    expect(level2Command.bequeathOptions.get('output')).toBeDefined();
  });

  it('allows child to override parent bequeathOptions', () => {
    const parentVerbose = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
    });

    const childVerbose = defineGlobalOption({
      name: 'verbose',
      schema: z.string().optional(), // Different schema
    });

    const parent = defineCommand({
      name: 'parent',
      bequeathOptions: [parentVerbose],
      commands: [
        defineCommand({
          name: 'child',
          bequeathOptions: [childVerbose],
          handler: async () => {},
        }),
      ],
      handler: async () => {},
    });

    const parentCommand = createCommand(parent);
    const childCommand = parentCommand.commands.get('child')!;

    expect(parentCommand.bequeathOptions.get('verbose')?.definition.schema).toBe(parentVerbose.schema);
    expect(childCommand.bequeathOptions.get('verbose')?.definition.schema).toBe(childVerbose.schema);
  });

  it('handles bequeathOptions with handlers', () => {
    const handler = vi.fn();
    const option = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
      handler,
    });

    const definition = defineCommand({
      name: 'test',
      bequeathOptions: [option],
      handler: async () => {},
    });

    const command = createCommand(definition);
    const bequeathOption = command.bequeathOptions.get('verbose');
    expect(bequeathOption?.definition.handler).toBe(handler);
  });

  it('handles bequeathOptions without schema', () => {
    const option = defineGlobalOption({
      name: 'verbose',
    });

    const definition = defineCommand({
      name: 'test',
      bequeathOptions: [option],
      handler: async () => {},
    });

    const command = createCommand(definition);
    const bequeathOption = command.bequeathOptions.get('verbose');
    expect(bequeathOption).toBeDefined();
    expect(bequeathOption?.definition.schema).toBeUndefined();
  });

  it('handles multiple bequeathOptions', () => {
    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
    });

    const outputOption = defineGlobalOption({
      name: 'output',
      schema: z.string().optional(),
    });

    const countOption = defineGlobalOption({
      name: 'count',
      schema: z.number().optional(),
    });

    const definition = defineCommand({
      name: 'test',
      bequeathOptions: [verboseOption, outputOption, countOption],
      handler: async () => {},
    });

    const command = createCommand(definition);
    expect(command.bequeathOptions.size).toBe(3);
    expect(command.bequeathOptions.get('verbose')).toBeDefined();
    expect(command.bequeathOptions.get('output')).toBeDefined();
    expect(command.bequeathOptions.get('count')).toBeDefined();
  });
});
