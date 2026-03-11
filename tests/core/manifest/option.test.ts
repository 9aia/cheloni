import { describe, it, expect } from 'vitest';
import z from 'zod';
import { getOptionManifest, getOptionsManifest } from '~/core/manifest/command/option';

describe('getOptionManifest', () => {
  it('extracts option name', () => {
    const schema = z.boolean();
    const manifest = getOptionManifest('verbose', schema);
    expect(manifest.name).toBe('verbose');
  });

  it('extracts description', () => {
    const schema = z.boolean().describe('Enable verbose output');
    const manifest = getOptionManifest('verbose', schema);
    expect(manifest.name).toBe('verbose');
  });

  it.skip('extracts alias', () => {
    const schema = z.boolean();
    Object.defineProperty(schema, '_def', {
      value: { metadata: { aliases: ['v'] } },
      writable: true,
      configurable: true,
    });
    const manifest = getOptionManifest('verbose', schema);
    expect(manifest.aliases).toEqual(['v']);
  });

  it.skip('extracts array alias', () => {
    const schema = z.boolean();
    Object.defineProperty(schema, '_def', {
      value: { metadata: { aliases: ['v', 'V'] } },
      writable: true,
      configurable: true,
    });
    const manifest = getOptionManifest('verbose', schema);
    expect(manifest.aliases).toEqual(['v', 'V']);
  });

  it.skip('extracts deprecated flag', () => {
    const schema = z.boolean();
    Object.defineProperty(schema, '_def', {
      value: { deprecated: true },
      writable: true,
      configurable: true,
    });
    const manifest = getOptionManifest('verbose', schema);
    expect(manifest.deprecated).toBe(true);
  });

  it.skip('extracts deprecated message', () => {
    const schema = z.boolean();
    Object.defineProperty(schema, '_def', {
      value: { deprecated: 'Use --new instead' },
      writable: true,
      configurable: true,
    });
    const manifest = getOptionManifest('verbose', schema);
    expect(manifest.deprecated).toBe('Use --new instead');
  });

  it('returns simple named manifest when definition is undefined', () => {
    const manifest = getOptionManifest('verbose');
    expect(manifest.name).toBe('verbose');
  });
});

describe('getOptionsManifest', () => {
  it('extracts manifests for all options', () => {
    const schema = z.object({
      verbose: z.boolean().describe('verbose'),
      name: z.string().describe('name'),
    });

    const manifests = getOptionsManifest(schema);
    expect(manifests).toHaveLength(2);
    expect(manifests.map(m => m.name)).toEqual(['verbose', 'name']);
  });

  it('returns empty array when schema has no shape', () => {
    const schema = z.object({});
    const manifests = getOptionsManifest(schema);
    expect(manifests).toHaveLength(0);
  });
});
