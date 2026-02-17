import { describe, it, expect, vi } from 'vitest';
import z from 'zod';
import { defineCli } from '~/core/definition/cli';
import { defineCommand } from '~/core/definition/command';
import { createCli } from '~/core/creation/cli';
import { executeCommand } from '~/core/execution/command';
import { InvalidPositionalError, InvalidOptionsError } from '~/core/execution/command/errors';

describe('executeCommand', () => {
  it('executes handler with parsed arguments', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          positional: z.string(),
          options: z.object({
            verbose: z.boolean().optional(),
          }),
          handler,
        }),
      })
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ['input', '--verbose'],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
    const context = handler.mock.calls[0]![0];
    expect(context.positional).toBe('input');
    expect(context.options.verbose).toBe(true);
  });

  it('validates positional argument', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          positional: z.string().min(5),
          handler: async () => {},
        }),
      })
    );

    const command = cli.command!;
    await expect(
      executeCommand({
        command,
        args: ['abc'],
        cli,
      })
    ).rejects.toThrow(InvalidPositionalError);
  });

  it('validates options', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          options: z.object({
            count: z.number(),
          }),
          handler: async () => {},
        }),
      })
    );

    const command = cli.command!;
    await expect(
      executeCommand({
        command,
        args: ['--count', 'invalid'],
        cli,
      })
    ).rejects.toThrow();
  });

  it('throws on unknown options with throw behavior', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          options: z.object({
            verbose: z.boolean(),
          }),
          throwOnExtrageousOptions: 'throw',
          handler: async () => {},
        }),
      })
    );

    const command = cli.command!;
    await expect(
      executeCommand({
        command,
        args: ['--unknown'],
        cli,
      })
    ).rejects.toThrow(InvalidOptionsError);
  });

  it('filters out unknown options with filter-out behavior', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          options: z.object({
            verbose: z.boolean().optional(),
          }),
          throwOnExtrageousOptions: 'filter-out',
          handler,
        }),
      })
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ['--verbose', '--unknown'],
      cli,
    });

    const context = handler.mock.calls[0]![0];
    expect(context.options.verbose).toBe(true);
    expect(context.options.unknown).toBeUndefined();
  });

  it('passes through unknown options with pass-through behavior', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          options: z.object({
            verbose: z.boolean().optional(),
          }),
          throwOnExtrageousOptions: 'pass-through',
          handler,
        }),
      })
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ['--verbose', '--unknown', 'value'],
      cli,
    });

    const context = handler.mock.calls[0]![0];
    expect(context.options.verbose).toBe(true);
    expect(context.options.unknown).toBe('value');
  });

  it('executes middleware before handler', async () => {
    const order: string[] = [];
    const handler = vi.fn(() => {
      order.push('handler');
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          middleware: async ({ next }) => {
            order.push('middleware');
            await next();
          },
          handler,
        }),
      })
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: [],
      cli,
    });

    expect(order).toEqual(['middleware', 'handler']);
  });

  it('calls onBeforeCommand hooks', async () => {
    const onBefore = vi.fn();
    const handler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test',
        plugin: {
          name: 'test-plugin',
          onBeforeCommand: onBefore,
        },
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: [],
      cli,
    });

    expect(onBefore).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('calls onAfterCommand hooks even if handler fails', async () => {
    const onAfter = vi.fn();
    const handler = vi.fn(() => {
      throw new Error('Handler error');
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        plugin: {
          name: 'test-plugin',
          onAfterCommand: onAfter,
        },
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    const command = cli.command!;
    await expect(
      executeCommand({
        command,
        args: [],
        cli,
      })
    ).rejects.toThrow('Handler error');

    expect(onAfter).toHaveBeenCalledOnce();
  });

  it('handles command-level plugins', async () => {
    const globalHook = vi.fn();
    const commandHook = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test',
        plugin: {
          name: 'global-plugin',
          onBeforeCommand: globalHook,
        },
        command: defineCommand({
          name: 'root',
          plugin: {
            name: 'command-plugin',
            onBeforeCommand: commandHook,
          },
          handler: async () => {},
        }),
      })
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: [],
      cli,
    });

    expect(globalHook).toHaveBeenCalledOnce();
    expect(commandHook).toHaveBeenCalledOnce();
  });

  it('handles command without handler', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
        }),
      })
    );

    const command = cli.command!;
    await expect(
      executeCommand({
        command,
        args: [],
        cli,
      })
    ).resolves.not.toThrow();
  });

  it('handles command without positional', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: [],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
    const context = handler.mock.calls[0]![0];
    expect(context.positional).toBeUndefined();
  });

  it('handles command without options', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: [],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
    const context = handler.mock.calls[0]![0];
    expect(context.options).toEqual({});
  });
});
