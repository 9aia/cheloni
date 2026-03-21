import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineCli, defineCommand, createCli, executeCli, PluginBeforeCommandExecutionError, PluginAfterCommandExecutionError, PluginDestroyError, PluginHookError } from '~/core';
import { deprecationPlugin } from '~/std/core';
import z from 'zod';

describe('executeCli', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let originalArgv: string[];

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    originalArgv = process.argv;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    processExitSpy.mockRestore();
    process.argv = originalArgv;
  });

  it('executes root command with no args', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });

    expect(handler).toHaveBeenCalledOnce();
  });

  it('executes subcommand by path', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'test',
              paths: ['t'],
              handler,
            }),
          ],
        }),
      })
    );

    await executeCli({ cli, args: ['t', 'arg1'] });

    expect(handler).toHaveBeenCalledOnce();
  });

  it('shows error when no root command', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
      })
    );

    await expect(
      executeCli({ cli, args: ['--flag'] })
    ).rejects.toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('shows deprecation warning for deprecated command', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [deprecationPlugin],
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'test',
              paths: ['test'],
              deprecated: true,
              handler,
            }),
          ],
        }),
      })
    );

    await executeCli({ cli, args: ['test'] });

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('shows deprecation message for deprecated command', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [deprecationPlugin],
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'test',
              paths: ['test'],
              deprecated: 'Use new command instead',
              handler,
            }),
          ],
        }),
      })
    );

    await executeCli({ cli, args: ['test'] });

    expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('Use new command instead');
  });

  it('shows deprecation warning for deprecated option when provided', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [deprecationPlugin],
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'test',
              paths: ['test'],
              options: z.object({
                old: z.boolean().optional().meta({ deprecated: 'Use --new instead' }),
              }),
              handler,
            }),
          ],
        }),
      })
    );

    await executeCli({ cli, args: ['test', '--old'] });

    const warnMessages = consoleWarnSpy.mock.calls.map((call: unknown[]) => String(call[0]));
    expect(warnMessages.some((m: string) => m.includes('Deprecated: --old'))).toBe(true);
    expect(warnMessages.some((m: string) => m.includes('Use --new instead'))).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('shows deprecation warning for deprecated positional when provided', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [deprecationPlugin],
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'test',
              paths: ['test'],
              positional: z.string().meta({ deprecated: 'Use new argument' }),
              handler,
            }),
          ],
        }),
      })
    );

    await executeCli({ cli, args: ['test', 'value'] });

    const warnMessages = consoleWarnSpy.mock.calls.map((call: unknown[]) => String(call[0]));
    expect(warnMessages.some((m: string) => m.includes('Deprecated:') && m.includes('Use new argument'))).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('calls onDestroy hooks', async () => {
    const onDestroy = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          {
            name: 'test-plugin',
            onDestroy,
          },
        ],
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'test',
              paths: ['test'],
              handler: async () => {},
            }),
          ],
        }),
      })
    );

    await executeCli({ cli, args: ['test'] });

    expect(onDestroy).toHaveBeenCalledOnce();
  });

  it('calls onDestroy hooks even on error', async () => {
    const onDestroy = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          {
            name: 'test-plugin',
            onDestroy,
          },
        ],
        command: defineCommand({
          name: 'root',
          handler: async () => {
            throw new Error('Handler error');
          },
        }),
      })
    );

    await expect(
      executeCli({ cli, args: [] })
    ).rejects.toThrow('process.exit called');

    expect(onDestroy).toHaveBeenCalledOnce();
  });

  it('handles onDestroy hook errors gracefully', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          {
            name: 'test-plugin',
            onDestroy: async () => {
              throw new Error('Destroy error');
            },
          },
        ],
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'test',
              paths: ['test'],
              handler: async () => {},
            }),
          ],
        }),
      })
    );

    await executeCli({ cli, args: ['test'] });

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('routes onBeforeCommandExecution failures to cli.onError (bypassing onError plugins)', async () => {
    const onErrorPlugin = vi.fn().mockReturnValue(true);
    const cliOnError = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          {
            name: 'before-throws',
            onBeforeCommandExecution: async () => {
              throw new Error('before boom');
            },
          },
          {
            name: 'error-handler-plugin',
            onError: onErrorPlugin,
          },
        ],
        onError: cliOnError,
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'test',
              paths: ['test'],
              handler: async () => {},
            }),
          ],
        }),
      })
    );

    await expect(executeCli({ cli, args: ['test'] })).rejects.toThrow('process.exit called');

    expect(onErrorPlugin).not.toHaveBeenCalled();
    expect(cliOnError).toHaveBeenCalledOnce();
    const params = cliOnError.mock.calls[0]![0];
    expect(params.error).toBeInstanceOf(PluginBeforeCommandExecutionError);
    expect(String((params.error as Error).message)).toContain('onBeforeCommandExecution');
  });

  it('routes onAfterCommandExecution failures to cli.onError without failing the command', async () => {
    const handler = vi.fn();
    const cliOnError = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          {
            name: 'after-throws',
            onAfterCommandExecution: async () => {
              throw new Error('after boom');
            },
          },
        ],
        onError: cliOnError,
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'test',
              paths: ['test'],
              handler,
            }),
          ],
        }),
      })
    );

    await executeCli({ cli, args: ['test'] });

    expect(handler).toHaveBeenCalledOnce();
    expect(cliOnError).toHaveBeenCalledOnce();
    const params = cliOnError.mock.calls[0]![0];
    expect(params.error).toBeInstanceOf(PluginAfterCommandExecutionError);
    expect(String((params.error as Error).message)).toContain('onAfterCommandExecution');
  });

  it('routes onDestroy failures to cli.onError', async () => {
    const handler = vi.fn();
    const cliOnError = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          {
            name: 'destroy-throws',
            onDestroy: async () => {
              throw new Error('destroy boom');
            },
          },
        ],
        onError: cliOnError,
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'test',
              paths: ['test'],
              handler,
            }),
          ],
        }),
      })
    );

    await executeCli({ cli, args: ['test'] });

    expect(handler).toHaveBeenCalledOnce();
    expect(cliOnError).toHaveBeenCalledOnce();
    const params = cliOnError.mock.calls[0]![0];
    expect(params.error).toBeInstanceOf(PluginDestroyError);
    expect(String((params.error as Error).message)).toContain('onDestroy');
  });

  it('continues error-handler plugins if an onError hook throws (and reports hook error to cli.onError)', async () => {
    const cliOnError = vi.fn();
    const handler = vi.fn(async () => {
      throw new Error('handler boom');
    });

    const throwingOnError = vi.fn(async () => {
      throw new Error('onError boom');
    });
    const handlingOnError = vi.fn(() => true);

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          { name: 'throwing', onError: throwingOnError },
          { name: 'handling', onError: handlingOnError },
        ],
        onError: cliOnError,
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await expect(executeCli({ cli, args: [] })).rejects.toThrow('process.exit called');

    expect(throwingOnError).toHaveBeenCalledOnce();
    expect(handlingOnError).toHaveBeenCalledOnce();

    // hook failure was reported to cli.onError
    expect(cliOnError).toHaveBeenCalled();
    const hookErrorCall = cliOnError.mock.calls.find(call => call[0]?.error instanceof PluginHookError);
    expect(hookErrorCall).toBeTruthy();
  });
});
