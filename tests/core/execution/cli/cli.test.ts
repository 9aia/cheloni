import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineCli } from '~/core/definition/cli';
import { defineCommand } from '~/core/definition/command';
import { createCli } from '~/core/creation/cli';
import { executeCli } from '~/core/execution/cli';
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

  it.skip('shows help when no args provided', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      })
    );

    await executeCli({ cli, args: [] });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it.skip('shows help for help command', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      })
    );

    await executeCli({ cli, args: ['help'] });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it.skip('shows help for --help flag', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      })
    );

    await executeCli({ cli, args: ['--help'] });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it.skip('shows help for -h flag', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      })
    );

    await executeCli({ cli, args: ['-h'] });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it.skip('shows help for specific command', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      })
    );

    await executeCli({ cli, args: ['help', 'test'] });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it.skip('shows version for version command', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        version: '1.0.0',
        command: defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      })
    );

    await executeCli({ cli, args: ['version'] });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it.skip('shows version for --version flag', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        version: '1.0.0',
        command: defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      })
    );

    await executeCli({ cli, args: ['--version'] });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it.skip('shows version for -v flag', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        version: '1.0.0',
        command: defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      })
    );

    await executeCli({ cli, args: ['-v'] });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('executes command by path', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          paths: ['t'],
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['t', 'arg1'] });

    expect(handler).toHaveBeenCalledOnce();
  });

  it.skip('executes default command when no path matches', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'default',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['--flag'] });

    expect(handler).toHaveBeenCalledOnce();
  });

  it('shows error for unknown command', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          handler: async () => {},
        }),
      })
    );

    await expect(
      executeCli({ cli, args: ['unknown'] })
    ).rejects.toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('shows error when no command found', async () => {
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

  it.skip('shows help when command has --help flag', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          handler: async () => {},
        }),
      })
    );

    await executeCli({ cli, args: ['test', '--help'] });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('shows deprecation warning for deprecated command', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          deprecated: true,
          handler,
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
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          deprecated: 'Use new command instead',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['test'] });

    expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('Use new command instead');
  });

  it('calls onDestroy hooks', async () => {
    const onDestroy = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugin: {
          name: 'test-plugin',
          onDestroy,
        },
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          handler: async () => {},
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
        plugin: {
          name: 'test-plugin',
          onDestroy,
        },
        command: defineCommand({
          name: 'test',
          handler: async () => {
            throw new Error('Handler error');
          },
        }),
      })
    );

    await expect(
      executeCli({ cli, args: ['test'] })
    ).rejects.toThrow('process.exit called');

    expect(onDestroy).toHaveBeenCalledOnce();
  });

  it('handles onDestroy hook errors gracefully', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugin: {
          name: 'test-plugin',
          onDestroy: async () => {
            throw new Error('Destroy error');
          },
        },
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          handler: async () => {},
        }),
      })
    );

    await executeCli({ cli, args: ['test'] });

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
