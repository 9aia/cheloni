import { describe, it, expect } from 'vitest';
import { definePlugin, getPluginManifest } from '~/core';

describe('getPluginManifest', () => {
  it('extracts plugin name', () => {
    const definition = definePlugin({
      name: 'test-plugin',
    });

    const manifest = getPluginManifest(definition);
    expect(manifest.name).toBe('test-plugin');
  });
});
