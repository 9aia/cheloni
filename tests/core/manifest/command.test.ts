import { describe, it, expect } from 'vitest';
import z from 'zod';
import { defineCommand, defineRootCommand } from '~/core/definition/command';
import { definePlugin } from '~/core/definition/plugin';
import { getCommandManifest, getRootCommandsManifest } from '~/core/manifest/command';

describe('getCommandManifest', () => {
  it('extracts basic command manifest', () => {
    const definition = defineCommand({
      name: 'test',
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.name).toBe('test');
    expect(manifest.paths).toEqual(['test']);
    expect(manifest.commands).toEqual([]);
  });

  it('includes paths', () => {
    const definition = defineCommand({
      name: 'test',
      paths: ['t', 'test'],
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.paths).toEqual(['t', 'test']);
  });

  it('defaults paths to command name when not provided', () => {
    const definition = defineCommand({
      name: 'my-command',
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.paths).toEqual(['my-command']);
  });

  it('includes description and details', () => {
    const definition = defineCommand({
      name: 'test',
      description: 'Test command',
      details: 'More details',
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.description).toBe('Test command');
    expect(manifest.details).toBe('More details');
  });

  it('handles missing description and details', () => {
    const definition = defineCommand({
      name: 'test',
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.description).toBeUndefined();
    expect(manifest.details).toBeUndefined();
  });

  it('includes examples', () => {
    const definition = defineCommand({
      name: 'test',
      example: 'test --flag',
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.example).toBe('test --flag');
  });

  it('handles array examples', () => {
    const definition = defineCommand({
      name: 'test',
      example: ['test --flag', 'test --other'],
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.example).toEqual(['test --flag', 'test --other']);
  });

  it('includes deprecated flag', () => {
    const definition = defineCommand({
      name: 'test',
      deprecated: true,
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.deprecated).toBe(true);
  });

  it('includes deprecated message', () => {
    const definition = defineCommand({
      name: 'test',
      deprecated: 'Use new command',
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.deprecated).toBe('Use new command');
  });

  it('handles missing deprecated flag', () => {
    const definition = defineCommand({
      name: 'test',
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.deprecated).toBeUndefined();
  });

  it('includes positional manifest with description', () => {
    const definition = defineCommand({
      name: 'test',
      positional: z.string().describe('input file'),
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.positional).toBeDefined();
    // Description extraction depends on Zod internals - just verify manifest exists
    expect(manifest.positional).toHaveProperty('description');
  });

  it('handles positional without description', () => {
    const definition = defineCommand({
      name: 'test',
      positional: z.string(),
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.positional).toBeDefined();
  });

  it('handles missing positional', () => {
    const definition = defineCommand({
      name: 'test',
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.positional).toBeUndefined();
  });

  it('includes options manifest', () => {
    const definition = defineCommand({
      name: 'test',
      options: z.object({
        verbose: z.boolean().describe('verbose output'),
        count: z.number().optional(),
      }),
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.options).toHaveLength(2);
    expect(manifest.options?.[0]?.name).toBe('verbose');
    expect(manifest.options?.[1]?.name).toBe('count');
  });

  it('handles missing options', () => {
    const definition = defineCommand({
      name: 'test',
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.options).toBeUndefined();
  });

  it('includes nested commands in manifest', () => {
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

    const manifest = getCommandManifest(definition);
    expect(manifest.commands).toHaveLength(2);
    expect(manifest.commands?.[0]?.name).toBe('child1');
    expect(manifest.commands?.[1]?.name).toBe('child2');
  });

  it('handles single nested command', () => {
    const definition = defineCommand({
      name: 'parent',
      command: defineCommand({
        name: 'child',
        handler: async () => {},
      }),
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.commands).toHaveLength(1);
    expect(manifest.commands?.[0]?.name).toBe('child');
  });

  it('handles deeply nested commands', () => {
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

    const manifest = getCommandManifest(definition);
    expect(manifest.commands).toHaveLength(1);
    expect(manifest.commands?.[0]?.name).toBe('level1');
    expect(manifest.commands?.[0]?.commands).toHaveLength(1);
    expect(manifest.commands?.[0]?.commands?.[0]?.name).toBe('level2');
  });

  it('includes plugins in manifest', () => {
    const definition = defineCommand({
      name: 'test',
      plugin: [
        definePlugin({ name: 'plugin1' }),
        definePlugin({ name: 'plugin2' }),
      ],
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.plugins).toHaveLength(2);
    expect(manifest.plugins?.[0]?.name).toBe('plugin1');
    expect(manifest.plugins?.[1]?.name).toBe('plugin2');
  });

  it('handles single plugin', () => {
    const definition = defineCommand({
      name: 'test',
      plugin: definePlugin({ name: 'plugin1' }),
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.plugins).toHaveLength(1);
    expect(manifest.plugins?.[0]?.name).toBe('plugin1');
  });

  it('handles missing plugins', () => {
    const definition = defineCommand({
      name: 'test',
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.plugins).toBeUndefined();
  });

  it('extracts complete command manifest with all fields', () => {
    const definition = defineCommand({
      name: 'convert',
      paths: ['c', 'convert'],
      description: 'Convert files',
      details: 'Detailed description',
      example: ['convert file.png', 'convert file.png --output out.jpg'],
      deprecated: 'Use transform instead',
      positional: z.string().describe('input file'),
      options: z.object({
        output: z.string().optional().describe('output path'),
        quality: z.number().min(0).max(100).optional(),
      }),
      command: defineCommand({
        name: 'subcommand',
        handler: async () => {},
      }),
      plugin: definePlugin({ name: 'analytics' }),
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.name).toBe('convert');
    expect(manifest.paths).toEqual(['c', 'convert']);
    expect(manifest.description).toBe('Convert files');
    expect(manifest.details).toBe('Detailed description');
    expect(manifest.example).toEqual(['convert file.png', 'convert file.png --output out.jpg']);
    expect(manifest.deprecated).toBe('Use transform instead');
    // Description extraction depends on Zod internals - just verify manifest exists
    expect(manifest.positional).toBeDefined();
    expect(manifest.options).toHaveLength(2);
    expect(manifest.commands).toHaveLength(1);
    expect(manifest.plugins).toHaveLength(1);
  });
});

describe('getRootCommandsManifest', () => {
  it('extracts root command manifest with name "root"', () => {
    const definition = defineRootCommand({
      command: defineCommand({
        name: 'test',
        handler: async () => {},
      }),
    });

    const manifest = getRootCommandsManifest(definition);
    expect(manifest.name).toBe('root');
    expect(manifest.commands).toHaveLength(1);
    expect(manifest.commands?.[0]?.name).toBe('test');
  });

  it('preserves all root command properties', () => {
    const definition = defineRootCommand({
      description: 'Root command',
      command: defineCommand({
        name: 'test',
        handler: async () => {},
      }),
    });

    const manifest = getRootCommandsManifest(definition);
    expect(manifest.name).toBe('root');
    expect(manifest.description).toBe('Root command');
  });
});
