import { describe, it, expect } from 'vitest';
import { interactiveOptionSchema } from '~/std/schemas/interactive';

describe('interactiveOptionSchema', () => {
  it('accepts true', () => {
    const result = interactiveOptionSchema.safeParse(true);
    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });

  it('accepts false', () => {
    const result = interactiveOptionSchema.safeParse(false);
    expect(result.success).toBe(true);
    expect(result.data).toBe(false);
  });

  it('accepts undefined (optional)', () => {
    const result = interactiveOptionSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('rejects non-boolean values', () => {
    expect(interactiveOptionSchema.safeParse('yes').success).toBe(false);
    expect(interactiveOptionSchema.safeParse(1).success).toBe(false);
  });

  it('has alias "i"', () => {
    const meta = interactiveOptionSchema.meta();
    expect(meta?.aliases).toContain('i');
  });

  it('has a description', () => {
    expect(interactiveOptionSchema.description).toBeDefined();
  });
});
