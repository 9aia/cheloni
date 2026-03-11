import { describe, it, expect } from 'vitest';
import { jsonDataSchema, yamlDataSchema } from '~/std/schemas/parse';

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

describe('yamlDataSchema', () => {
  it('parses a valid YAML string into an object', async () => {
    const result = await yamlDataSchema.safeParseAsync('key: value');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ key: 'value' });
  });

  it('parses a YAML list', async () => {
    const result = await yamlDataSchema.safeParseAsync('- one\n- two\n- three');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(['one', 'two', 'three']);
  });

  it('parses nested YAML', async () => {
    const yaml = 'a:\n  b:\n    c: 1';
    const result = await yamlDataSchema.safeParseAsync(yaml);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ a: { b: { c: 1 } } });
  });

  it('rejects non-string input', async () => {
    const result = await yamlDataSchema.safeParseAsync(123);
    expect(result.success).toBe(false);
  });
});
