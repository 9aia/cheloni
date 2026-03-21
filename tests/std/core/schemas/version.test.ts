import { describe, it, expect } from 'vitest';
import { versionOptionSchema } from '~/std/core';

describe('versionOptionSchema', () => {
  it('accepts true', () => {
    const result = versionOptionSchema.safeParse(true);
    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });

  it('accepts false', () => {
    const result = versionOptionSchema.safeParse(false);
    expect(result.success).toBe(true);
    expect(result.data).toBe(false);
  });

  it('accepts undefined (optional)', () => {
    const result = versionOptionSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('rejects non-boolean values', () => {
    expect(versionOptionSchema.safeParse('1.0.0').success).toBe(false);
    expect(versionOptionSchema.safeParse(1).success).toBe(false);
  });

  it('has alias "v"', () => {
    const meta = versionOptionSchema.meta();
    expect(meta?.aliases).toContain('v');
  });

  it('has a description', () => {
    expect(versionOptionSchema.description).toBeDefined();
  });
});
