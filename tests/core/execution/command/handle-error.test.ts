import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import z from 'zod';
import { defineCli } from '~/core/definition/cli';
import { defineCommand } from '~/core/definition/command';
import { createCli } from '~/core/creation/cli';
import { InvalidPositionalError, InvalidOptionsError } from '~/core/execution/command/errors';
import { handleError } from '~/core/execution/command/handle-error';

describe('handleError', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('handles InvalidPositionalError', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'test',
          positional: z.string().describe('input file'),
          handler: async () => {},
        }),
      })
    );

    const command = [...cli.rootCommands][0]!;
    const error = new InvalidPositionalError('Invalid positional', [
      {
        code: 'invalid_type',
        expected: 'string',
        path: [],
        message: 'Expected string',
      } as z.core.$ZodIssue,
    ]);

    handleError({ error, command });

    expect(consoleErrorSpy).toHaveBeenCalled();
    const calls = consoleErrorSpy.mock.calls;
    expect(calls.some((call: unknown[]) => call[0]?.toString().includes('positional argument'))).toBe(true);
  });

  it('handles InvalidOptionsError', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'test',
          options: z.object({
            verbose: z.boolean().describe('verbose output'),
          }),
          handler: async () => {},
        }),
      })
    );

    const command = [...cli.rootCommands][0]!;
    const error = new InvalidOptionsError('Invalid options', [
      {
        code: 'invalid_type',
        expected: 'boolean',
        path: ['verbose'],
        message: 'Expected boolean',
      } as z.core.$ZodIssue,
    ]);

    handleError({ error, command });

    expect(consoleErrorSpy).toHaveBeenCalled();
    const calls = consoleErrorSpy.mock.calls;
    expect(calls.some((call: unknown[]) => call[0]?.toString().includes('option --verbose'))).toBe(true);
  });

  it('handles generic Error', () => {
    const error = new Error('Generic error');
    const command = {
      definition: {
        name: 'test',
      },
      manifest: {
        name: 'test',
      },
    } as any;

    handleError({ error, command });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Generic error');
  });

  it('handles unknown error', () => {
    const error = 'String error';
    const command = {
      definition: {
        name: 'test',
      },
      manifest: {
        name: 'test',
      },
    } as any;

    handleError({ error, command });

    expect(consoleErrorSpy).toHaveBeenCalledWith('An unknown error occurred');
  });

  it.skip('includes option description in error message', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'test',
          options: z.object({
            verbose: z.boolean().describe('Enable verbose output'),
          }),
          handler: async () => {},
        }),
      })
    );

    const command = [...cli.rootCommands][0]!;
    const error = new InvalidOptionsError('Invalid options', [
      {
        code: 'invalid_type',
        expected: 'boolean',
        path: ['verbose'],
        message: 'Expected boolean',
      } as z.core.$ZodIssue,
    ]);

    handleError({ error, command });

    const calls = consoleErrorSpy.mock.calls;
    const errorOutput = calls.map((c: unknown[]) => c[0]).join(' ');
    expect(errorOutput).toContain('verbose output');
  });
});
