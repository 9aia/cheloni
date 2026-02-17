import { describe, it, expect } from 'vitest';
import { definePlugin } from '~/core/definition/plugin';
import { getPluginManifest } from '~/core/manifest/plugin';

describe('getPluginManifest', () => {
  it('extracts plugin name', () => {
    const definition = definePlugin({
      name: 'test-plugin',
    });

    const manifest = getPluginManifest(definition);
    expect(manifest.name).toBe('test-plugin');
  });
});
