import { describe, expect, it } from 'vitest';
import { jsonDataSchema } from '~/std/parse';

describe('jsonDataSchema', () => {
  it('parses a valid JSON string into an object', () => {
    const result = jsonDataSchema.safeParse('{"key":"value"}');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ key: 'value' });
  });

  it('parses a JSON array', () => {
    const result = jsonDataSchema.safeParse('[1, 2, 3]');
    expect(result.success).toBe(true);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('parses nested JSON', () => {
    const result = jsonDataSchema.safeParse('{"a":{"b":{"c":1}}}');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ a: { b: { c: 1 } } });
  });

  it('fails on invalid JSON', () => {
    const result = jsonDataSchema.safeParse('{ invalid }');
    expect(result.success).toBe(false);
  });

  it('fails on empty string', () => {
    const result = jsonDataSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects non-string input', () => {
    const result = jsonDataSchema.safeParse(123);
    expect(result.success).toBe(false);
  });
});
