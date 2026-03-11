import { describe, it, expect } from 'vitest';
import { forceOptionSchema } from '~/std/schemas/force';

describe('forceOptionSchema', () => {
  it('accepts true', () => {
    const result = forceOptionSchema.safeParse(true);
    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });

  it('accepts false', () => {
    const result = forceOptionSchema.safeParse(false);
    expect(result.success).toBe(true);
    expect(result.data).toBe(false);
  });

  it('accepts undefined (optional)', () => {
    const result = forceOptionSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('rejects non-boolean values', () => {
    expect(forceOptionSchema.safeParse('yes').success).toBe(false);
    expect(forceOptionSchema.safeParse(1).success).toBe(false);
  });

  it('has alias "f"', () => {
    const meta = forceOptionSchema.meta();
    expect(meta?.aliases).toContain('f');
  });

  it('has a description in meta', () => {
    const meta = forceOptionSchema.meta();
    expect(meta?.description).toBeDefined();
  });
});
