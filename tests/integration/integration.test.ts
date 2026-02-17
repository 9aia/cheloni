import { describe, it, expect, vi } from 'vitest';
import z from 'zod';
import { defineCli } from '~/core/definition/cli';
import { defineCommand } from '~/core/definition/command';
import { createCli } from '~/core/creation/cli';
import { executeCli } from '~/core/execution/cli';

describe('Integration Tests', () => {
  it('executes complete CLI workflow', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        command: defineCommand({
          name: 'greet',
          paths: ['g', 'greet'],
          description: 'Greet someone',
          positional: z.string().describe('name'),
          options: z.object({
            verbose: z.boolean().optional().describe('verbose output'),
            count: z.number().default(1).describe('number of times'),
          }),
          handler,
        }),
      })
    );

    await executeCli({
      cli,
      args: ['greet', 'Alice', '--verbose', '--count', '3'],
    });

    expect(handler).toHaveBeenCalledOnce();
    const context = handler.mock.calls[0]![0];
    expect(context.positional).toBe('Alice');
    expect(context.options.verbose).toBe(true);
    expect(context.options.count).toBe(3);
  });

  it('handles middleware chain', async () => {
    const order: string[] = [];
    let capturedContext: any;
    const handler = vi.fn((context: any) => {
      order.push('handler');
      capturedContext = context;
    });

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          middleware: [
            async ({ next }) => {
              order.push('middleware1');
              await next();
            },
            async ({ data, next }) => {
              data.value = 'test';
              order.push('middleware2');
              await next();
            },
          ],
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['test'] });

    expect(order).toEqual(['middleware1', 'middleware2', 'handler']);
    expect(handler).toHaveBeenCalledOnce();
    expect(capturedContext).toBeDefined();
    expect(capturedContext?.data.value).toBe('test');
  });

  it('handles plugin lifecycle', async () => {
    const lifecycle: string[] = [];
    const handler = vi.fn(() => {
      lifecycle.push('handler');
    });

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugin: {
          name: 'test-plugin',
          onInit: async () => {
            lifecycle.push('onInit');
          },
          onBeforeCommand: async () => {
            lifecycle.push('onBeforeCommand');
          },
          onAfterCommand: async () => {
            lifecycle.push('onAfterCommand');
          },
          onDestroy: async () => {
            lifecycle.push('onDestroy');
          },
        },
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['test'] });

    expect(lifecycle).toEqual(['onInit', 'onBeforeCommand', 'handler', 'onAfterCommand', 'onDestroy']);
  });

  it('validates and rejects invalid positional', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          positional: z.string().min(5),
          handler,
        }),
      })
    );

    await expect(
      executeCli({ cli, args: ['test', 'abc'] })
    ).rejects.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });

  it('validates and rejects invalid options', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          options: z.object({
            count: z.number(),
          }),
          handler,
        }),
      })
    );

    await expect(
      executeCli({ cli, args: ['test', '--count', 'invalid'] })
    ).rejects.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });

  it('handles multiple commands with different paths', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: [
          defineCommand({
            name: 'cmd1',
            paths: ['a', 'alpha'],
            handler: handler1,
          }),
          defineCommand({
            name: 'cmd2',
            paths: ['b', 'beta'],
            handler: handler2,
          }),
        ],
      })
    );

    await executeCli({ cli, args: ['a'] });
    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).not.toHaveBeenCalled();

    handler1.mockClear();
    handler2.mockClear();

    await executeCli({ cli, args: ['beta'] });
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it.skip('handles default command', async () => {
    const defaultHandler = vi.fn();
    const pathHandler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: [
          defineCommand({
            name: 'default',
            handler: defaultHandler,
          }),
          defineCommand({
            name: 'with-path',
            paths: ['path'],
            handler: pathHandler,
          }),
        ],
      })
    );

    await executeCli({ cli, args: ['--flag'] });
    expect(defaultHandler).toHaveBeenCalledOnce();
    expect(pathHandler).not.toHaveBeenCalled();
  });

  it.skip('handles command with alias options', async () => {
    const handler = vi.fn();
    const verboseSchema = z.boolean();
    Object.defineProperty(verboseSchema, '_def', {
      value: { alias: 'v' },
      writable: true,
      configurable: true,
    });

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          options: z.object({
            verbose: verboseSchema,
          }),
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['test', '-v'] });

    expect(handler).toHaveBeenCalledOnce();
    const context = handler.mock.calls[0]![0];
    expect(context.options.verbose).toBe(true);
  });

  it('handles extrageous options with filter-out', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          options: z.object({
            verbose: z.boolean().optional(),
          }),
          throwOnExtrageousOptions: 'filter-out',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['test', '--verbose', '--unknown'] });

    expect(handler).toHaveBeenCalledOnce();
    const context = handler.mock.calls[0]![0];
    expect(context.options.verbose).toBe(true);
    expect(context.options.unknown).toBeUndefined();
  });

  it('handles command-level plugins', async () => {
    const globalHook = vi.fn();
    const commandHook = vi.fn();
    const handler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugin: {
          name: 'global',
          onBeforeCommand: globalHook,
        },
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          plugin: {
            name: 'command',
            onBeforeCommand: commandHook,
          },
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['test'] });

    expect(globalHook).toHaveBeenCalledOnce();
    expect(commandHook).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledOnce();
  });
});
