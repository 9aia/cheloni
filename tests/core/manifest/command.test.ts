import { describe, it, expect } from 'vitest';
import z from 'zod';
import { defineCommand } from '~/core/definition/command';
import { getCommandManifest } from '~/core/manifest/command';

describe('getCommandManifest', () => {
  it('extracts basic command manifest', () => {
    const definition = defineCommand({
      name: 'test',
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.name).toBe('test');
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

  it('includes positional manifest', () => {
    const definition = defineCommand({
      name: 'test',
      positional: z.string().describe('input file'),
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.positional).toBeDefined();
  });

  it('includes options manifest', () => {
    const definition = defineCommand({
      name: 'test',
      options: z.object({
        verbose: z.boolean().describe('verbose output'),
      }),
      handler: async () => {},
    });

    const manifest = getCommandManifest(definition);
    expect(manifest.options).toHaveLength(1);
    expect(manifest.options?.[0]?.name).toBe('verbose');
  });
});
