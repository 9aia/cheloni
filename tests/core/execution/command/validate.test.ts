import { describe, it, expect } from 'vitest';
import z from 'zod';
import { getValidOptionNames, validateOptionsExist } from '~/core/execution/command/validate';

describe('getValidOptionNames', () => {
  it('returns empty set for undefined schema', () => {
    expect(getValidOptionNames(undefined as any)).toEqual(new Set());
  });

  it('returns empty set for non-object schema', () => {
    expect(getValidOptionNames(z.string())).toEqual(new Set());
  });

  it('extracts option names from object schema', () => {
    const schema = z.object({
      verbose: z.boolean(),
      name: z.string(),
    });
    const validNames = getValidOptionNames(schema);
    expect(validNames.has('verbose')).toBe(true);
    expect(validNames.has('name')).toBe(true);
    expect(validNames.size).toBe(2);
  });

  it.skip('includes aliases in valid names', () => {
    const verboseSchema = z.boolean();
    Object.defineProperty(verboseSchema, '_def', {
      value: { alias: 'v' },
      writable: true,
      configurable: true,
    });
    
    const schema = z.object({
      verbose: verboseSchema,
    });
    
    const validNames = getValidOptionNames(schema);
    expect(validNames.has('verbose')).toBe(true);
    expect(validNames.has('v')).toBe(true);
  });

  it.skip('handles array aliases', () => {
    const verboseSchema = z.boolean();
    Object.defineProperty(verboseSchema, '_def', {
      value: { alias: ['v', 'V'] },
      writable: true,
      configurable: true,
    });
    
    const schema = z.object({
      verbose: verboseSchema,
    });
    
    const validNames = getValidOptionNames(schema);
    expect(validNames.has('verbose')).toBe(true);
    expect(validNames.has('v')).toBe(true);
    expect(validNames.has('V')).toBe(true);
  });
});

describe('validateOptionsExist', () => {
  it('passes through when no schema and behavior is pass-through', () => {
    const result = validateOptionsExist({ flag: true }, undefined, 'pass-through');
    expect(result).toEqual({ flag: true });
  });

  it('filters out when no schema and behavior is filter-out', () => {
    const result = validateOptionsExist({ flag: true }, undefined, 'filter-out');
    expect(result).toEqual({});
  });

  it('throws when no schema and behavior is throw', () => {
    expect(() => {
      validateOptionsExist({ flag: true }, undefined, 'throw');
    }).toThrow();
  });

  it('does not throw when no options provided and no schema', () => {
    const result = validateOptionsExist({}, undefined, 'throw');
    expect(result).toEqual({});
  });

  it('passes through valid options', () => {
    const schema = z.object({
      verbose: z.boolean(),
    });
    const result = validateOptionsExist({ verbose: true }, schema, 'throw');
    expect(result).toEqual({ verbose: true });
  });

  it('throws on unknown options with throw behavior', () => {
    const schema = z.object({
      verbose: z.boolean(),
    });
    expect(() => {
      validateOptionsExist({ verbose: true, unknown: 'value' }, schema, 'throw');
    }).toThrow();
  });

  it('filters out unknown options with filter-out behavior', () => {
    const schema = z.object({
      verbose: z.boolean(),
    });
    const result = validateOptionsExist(
      { verbose: true, unknown: 'value' },
      schema,
      'filter-out'
    );
    expect(result).toEqual({ verbose: true });
  });

  it('passes through unknown options with pass-through behavior', () => {
    const schema = z.object({
      verbose: z.boolean(),
    });
    const result = validateOptionsExist(
      { verbose: true, unknown: 'value' },
      schema,
      'pass-through'
    );
    expect(result).toEqual({ verbose: true, unknown: 'value' });
  });

  it.skip('includes aliases in error message', () => {
    const verboseSchema = z.boolean();
    Object.defineProperty(verboseSchema, '_def', {
      value: { alias: 'v' },
      writable: true,
      configurable: true,
    });
    
    const schema = z.object({
      verbose: verboseSchema,
    });
    
    expect(() => {
      validateOptionsExist({ unknown: 'value' }, schema, 'throw');
    }).toThrow(/--verbose/);
  });

  it('handles empty options object', () => {
    const schema = z.object({
      verbose: z.boolean(),
    });
    const result = validateOptionsExist({}, schema, 'throw');
    expect(result).toEqual({});
  });
});
