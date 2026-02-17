import { describe, it, expect } from 'vitest';
import z from 'zod';
import { defineCli } from '~/core/definition/cli';
import { defineCommand } from '~/core/definition/command';
import { getCliManifest } from '~/core/manifest/cli';

describe('getCliManifest', () => {
  it('extracts basic CLI manifest', () => {
    const definition = defineCli({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
    });

    const manifest = getCliManifest(definition);
    expect(manifest.name).toBe('test-cli');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.description).toBe('Test CLI');
  });

  it('includes details and deprecated flag', () => {
    const definition = defineCli({
      name: 'test-cli',
      details: 'More details',
      deprecated: 'Use new-cli instead',
    });

    const manifest = getCliManifest(definition);
    expect(manifest.details).toBe('More details');
    expect(manifest.deprecated).toBe('Use new-cli instead');
  });

  it('includes command manifests', () => {
    const definition = defineCli({
      name: 'test-cli',
      command: defineCommand({
        name: 'test',
        handler: async () => {},
      }),
    });

    const manifest = getCliManifest(definition);
    expect(manifest.rootCommands).toHaveLength(1);
    expect(manifest.rootCommands?.[0]?.name).toBe('test');
  });

  it('handles multiple commands', () => {
    const definition = defineCli({
      name: 'test-cli',
      command: [
        defineCommand({
          name: 'cmd1',
          handler: async () => {},
        }),
        defineCommand({
          name: 'cmd2',
          handler: async () => {},
        }),
      ],
    });

    const manifest = getCliManifest(definition);
    expect(manifest.rootCommands).toHaveLength(2);
    expect(manifest.rootCommands?.map(c => c.name)).toEqual(['cmd1', 'cmd2']);
  });

  it('includes global options', () => {
    const definition = defineCli({
      name: 'test-cli',
      globalOption: {
        name: 'verbose',
        schema: z.boolean(),
      },
    });

    const manifest = getCliManifest(definition);
    expect(manifest.globalOptions).toHaveLength(1);
    expect(manifest.globalOptions?.[0]?.name).toBe('verbose');
  });

  it('handles multiple global options', () => {
    const definition = defineCli({
      name: 'test-cli',
      globalOption: [
        {
          name: 'verbose',
          schema: z.boolean(),
        },
        {
          name: 'output',
          schema: z.string(),
        },
      ],
    });

    const manifest = getCliManifest(definition);
    expect(manifest.globalOptions).toHaveLength(2);
    expect(manifest.globalOptions?.map(o => o.name)).toEqual(['verbose', 'output']);
  });

  it('handles empty commands and options', () => {
    const definition = defineCli({
      name: 'test-cli',
    });

    const manifest = getCliManifest(definition);
    expect(manifest.rootCommands).toEqual([]);
    expect(manifest.globalOptions).toEqual([]);
  });
});
