import { describe, it, expect } from 'vitest';
import z from 'zod';
import {
  InvalidSchemaError,
  InvalidOptionsError,
  InvalidOptionError,
  InvalidPositionalError,
} from '~/core/execution/command/errors';

describe('InvalidSchemaError', () => {
  it('creates error with message and issues', () => {
    const issues: z.core.$ZodIssue[] = [
      {
        code: 'invalid_type',
        expected: 'string',
        path: [],
        message: 'Expected string',
      } as z.core.$ZodIssue,
    ];

    const error = new InvalidSchemaError('Test error', issues);
    expect(error.message).toBe('Test error');
    expect(error.issues).toEqual(issues);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('InvalidOptionsError', () => {
  it('extends InvalidSchemaError', () => {
    const issues: z.core.$ZodIssue[] = [];
    const error = new InvalidOptionsError('Options error', issues);
    expect(error).toBeInstanceOf(InvalidSchemaError);
    expect(error.message).toBe('Options error');
  });
});

describe('InvalidOptionError', () => {
  it('extends InvalidSchemaError', () => {
    const issues: z.core.$ZodIssue[] = [];
    const error = new InvalidOptionError('Option error', issues);
    expect(error).toBeInstanceOf(InvalidSchemaError);
    expect(error.message).toBe('Option error');
  });
});

describe('InvalidPositionalError', () => {
  it('extends InvalidSchemaError', () => {
    const issues: z.core.$ZodIssue[] = [];
    const error = new InvalidPositionalError('Positional error', issues);
    expect(error).toBeInstanceOf(InvalidSchemaError);
    expect(error.message).toBe('Positional error');
  });
});
