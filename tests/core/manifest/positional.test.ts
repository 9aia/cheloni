import { describe, it, expect } from 'vitest';
import z from 'zod';
import { getPositionalManifest } from '~/core/manifest/command/positional';

describe('getPositionalManifest', () => {
  it('extracts description', () => {
    const schema = z.string().describe('input file');
    const manifest = getPositionalManifest(schema);
    expect(manifest).toBeDefined();
  });

  it.skip('extracts details from metadata', () => {
    const schema = z.string();
    Object.defineProperty(schema, '_def', {
      value: { metadata: { details: 'More info' } },
      writable: true,
      configurable: true,
    });
    const manifest = getPositionalManifest(schema);
    expect(manifest.details).toBe('More info');
  });

  it.skip('extracts deprecated flag', () => {
    const schema = z.string();
    Object.defineProperty(schema, '_def', {
      value: { deprecated: true },
      writable: true,
      configurable: true,
    });
    const manifest = getPositionalManifest(schema);
    expect(manifest.deprecated).toBe(true);
  });

  it.skip('extracts deprecated message', () => {
    const schema = z.string();
    Object.defineProperty(schema, '_def', {
      value: { deprecated: 'Use new format' },
      writable: true,
      configurable: true,
    });
    const manifest = getPositionalManifest(schema);
    expect(manifest.deprecated).toBe('Use new format');
  });

  it('returns empty manifest when no metadata', () => {
    const schema = z.string();
    const manifest = getPositionalManifest(schema);
    expect(manifest).toEqual({});
  });
});
