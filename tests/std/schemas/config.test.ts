import { describe, it, expect } from 'vitest';
import { configOptionSchema } from '~/std/schemas/config';

describe('configOptionSchema', () => {
  it('accepts a valid file path', () => {
    const result = configOptionSchema.safeParse('config.json');
    expect(result.success).toBe(true);
    expect(result.data).toBe('config.json');
  });

  it('accepts a nested path', () => {
    const result = configOptionSchema.safeParse('.config/app.json');
    expect(result.success).toBe(true);
  });

  it('accepts undefined (optional)', () => {
    const result = configOptionSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('rejects invalid path characters', () => {
    expect(configOptionSchema.safeParse('file<name>.json').success).toBe(false);
  });

  it('has alias "c"', () => {
    const meta = configOptionSchema.meta();
    expect(meta?.aliases).toContain('c');
  });

  it('has a description', () => {
    expect(configOptionSchema.description).toBeDefined();
  });
});
