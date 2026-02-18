import { describe, it, expect } from 'vitest';
import z from 'zod';
import {
  getSchemaObject,
  getSchemaDescription,
  getSchemaAlias,
  getAliasMap,
  getSchemaDeprecated,
} from '~/utils/definition';

describe('getSchemaObject', () => {
  it('returns undefined for non-object schema', () => {
    expect(getSchemaObject(z.string())).toBeUndefined();
    expect(getSchemaObject(z.number())).toBeUndefined();
  });

  it('extracts object shape from ZodObject', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const shape = getSchemaObject(schema);
    expect(shape).toBeDefined();
    expect(Object.keys(shape!)).toEqual(['name', 'age']);
  });

  it('returns undefined for undefined input', () => {
    expect(getSchemaObject(undefined as any)).toBeUndefined();
  });
});

describe('getSchemaDescription', () => {
  it('returns undefined for schema without description', () => {
    expect(getSchemaDescription(z.string())).toBeUndefined();
  });

  it.skip('extracts description from schema', () => {
    const schema = z.string().describe('test description');
    const description = getSchemaDescription(schema);
    expect(description).toBeDefined();
  });

  it('returns undefined for undefined input', () => {
    expect(getSchemaDescription(undefined)).toBeUndefined();
  });
});

describe('getSchemaAlias', () => {
  it('returns undefined for schema without alias', () => {
    expect(getSchemaAlias(z.string())).toBeUndefined();
  });

  it.skip('extracts alias from schema metadata', () => {
    const schema = z.string();
    Object.defineProperty(schema, '_def', {
      value: { alias: 'v' },
      writable: true,
      configurable: true,
    });
    expect(getSchemaAlias(schema)).toBe('v');
  });

  it.skip('extracts array alias from schema metadata', () => {
    const schema = z.string();
    Object.defineProperty(schema, '_def', {
      value: { alias: ['v', 'verbose'] },
      writable: true,
      configurable: true,
    });
    expect(getSchemaAlias(schema)).toEqual(['v', 'verbose']);
  });

  it('returns undefined for undefined input', () => {
    expect(getSchemaAlias(undefined)).toBeUndefined();
  });
});

describe('getSchemaDeprecated', () => {
  it('returns undefined for schema without deprecated flag', () => {
    expect(getSchemaDeprecated(z.string())).toBeUndefined();
  });

  it.skip('extracts boolean deprecated flag', () => {
    const schema = z.string();
    Object.defineProperty(schema, '_def', {
      value: { deprecated: true },
      writable: true,
      configurable: true,
    });
    expect(getSchemaDeprecated(schema)).toBe(true);
  });

  it.skip('extracts string deprecated message', () => {
    const schema = z.string();
    Object.defineProperty(schema, '_def', {
      value: { deprecated: 'Use new option instead' },
      writable: true,
      configurable: true,
    });
    expect(getSchemaDeprecated(schema)).toBe('Use new option instead');
  });

  it('returns undefined for undefined input', () => {
    expect(getSchemaDeprecated(undefined)).toBeUndefined();
  });
});

describe('getAliasMap', () => {
  it('returns empty object for non-object schema', () => {
    expect(getAliasMap(z.string())).toEqual({});
  });

  it('returns empty object when no aliases defined', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    expect(getAliasMap(schema)).toEqual({});
  });

  it.skip('extracts alias map from object schema', () => {
    const verboseSchema = z.boolean();
    Object.defineProperty(verboseSchema, '_def', {
      value: { alias: 'v' },
      writable: true,
      configurable: true,
    });
    
    const schema = z.object({
      verbose: verboseSchema,
      help: z.boolean(),
    });
    
    const aliasMap = getAliasMap(schema);
    expect(aliasMap).toEqual({ verbose: 'v' });
  });

  it.skip('handles multiple aliases', () => {
    const verboseSchema = z.boolean();
    Object.defineProperty(verboseSchema, '_def', {
      value: { alias: ['v', 'V'] },
      writable: true,
      configurable: true,
    });
    
    const schema = z.object({
      verbose: verboseSchema,
    });
    
    const aliasMap = getAliasMap(schema);
    expect(aliasMap).toEqual({ verbose: ['v', 'V'] });
  });
});
