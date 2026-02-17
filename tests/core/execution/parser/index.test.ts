import { describe, it, expect } from 'vitest';
import z from 'zod';
import { parseArgs, extractPositionalValue } from '~/core/execution/parser';

describe('parseArgs', () => {
  it('parses positional arguments', () => {
    const result = parseArgs(['arg1', 'arg2']);
    expect(result.positional).toEqual(['arg1', 'arg2']);
    expect(result.options).toEqual({});
  });

  it('parses options', () => {
    const result = parseArgs(['--verbose', '--name', 'test']);
    expect(result.options.verbose).toBe(true);
    expect(result.options.name).toBe('test');
  });

  it('parses options with values', () => {
    const result = parseArgs(['--count', '5', '--flag']);
    expect(result.options.count).toBe(5);
    expect(result.options.flag).toBe(true);
  });

  it('handles alias map', () => {
    const aliasMap = { verbose: 'v' };
    const result = parseArgs(['-v'], aliasMap);
    expect(result.options.verbose).toBe(true);
  });

  it('handles multiple aliases', () => {
    const aliasMap = { verbose: ['v', 'V'] };
    const result = parseArgs(['-v'], aliasMap);
    expect(result.options.verbose).toBe(true);
  });

  it('separates positional and options', () => {
    const result = parseArgs(['arg1', '--flag', 'arg2']);
    expect(result.positional).toEqual(['arg1']);
    expect(result.options.flag).toBe('arg2');
  });

  it('handles empty args', () => {
    const result = parseArgs([]);
    expect(result.positional).toEqual([]);
    expect(result.options).toEqual({});
  });
});

describe('extractPositionalValue', () => {
  it('returns undefined when schema is undefined', () => {
    expect(extractPositionalValue(undefined, ['arg1'], 0)).toBeUndefined();
  });

  it('extracts value at index', () => {
    expect(extractPositionalValue(z.string(), ['arg1', 'arg2'], 0)).toBe('arg1');
    expect(extractPositionalValue(z.string(), ['arg1', 'arg2'], 1)).toBe('arg2');
  });

  it('returns undefined when index is out of bounds', () => {
    expect(extractPositionalValue(z.string(), ['arg1'], 1)).toBeUndefined();
    expect(extractPositionalValue(z.string(), [], 0)).toBeUndefined();
  });
});
