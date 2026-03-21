import { describe, it, expect } from 'vitest';
import { createPlugin, definePlugin } from '~/core';

describe('createPlugin', () => {
  it('creates plugin from definition', () => {
    const definition = definePlugin({
      name: 'test-plugin',
    });

    const plugin = createPlugin(definition);
    expect(plugin.definition).toBe(definition);
    expect(plugin.manifest.name).toBe('test-plugin');
  });
});
