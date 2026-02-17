import { describe, it, expect } from 'vitest';
import { defineCli } from '~/core/definition/cli';
import { defineCommand } from '~/core/definition/command';
import { definePlugin } from '~/core/definition/plugin';
import { createCli } from '~/core/creation/cli';
import z from 'zod';

describe('createCli', () => {
  it('creates CLI with basic definition', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        version: '1.0.0',
      })
    );

    expect(cli.manifest.name).toBe('test-cli');
    expect(cli.manifest.version).toBe('1.0.0');
    expect(cli.command).toBeUndefined();
    expect(cli.plugins.size).toBe(0);
    expect(cli.globalOptions.size).toBe(0);
  });

  it('creates root command from definition', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'root',
          handler: async () => {},
        }),
      })
    );

    expect(cli.command).toBeDefined();
    expect(cli.command?.manifest.name).toBe('root');
  });

  it('creates root command with nested subcommands', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'root',
          command: [
            defineCommand({
              name: 'cmd1',
              handler: async () => {},
            }),
            defineCommand({
              name: 'cmd2',
              handler: async () => {},
            }),
          ],
          handler: async () => {},
        }),
      })
    );

    expect(cli.command).toBeDefined();
    expect(cli.command?.commands.size).toBe(2);
  });

  it('creates global options', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        globalOption: {
          name: 'verbose',
          schema: z.boolean(),
        },
      })
    );

    expect(cli.globalOptions.size).toBe(1);
    const option = [...cli.globalOptions][0];
    expect(option?.definition.name).toBe('verbose');
  });

  it('creates multiple global options', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        globalOption: [
          {
            name: 'verbose',
            schema: z.boolean(),
          },
          {
            name: 'output',
            schema: z.string(),
          },
        ],
      })
    );

    expect(cli.globalOptions.size).toBe(2);
  });

  it('creates plugins', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugin: definePlugin({
          name: 'test-plugin',
        }),
      })
    );

    expect(cli.plugins.size).toBe(1);
    const plugin = [...cli.plugins][0];
    expect(plugin?.manifest.name).toBe('test-plugin');
  });

  it('calls onInit hooks', async () => {
    let initCalled = false;

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugin: definePlugin({
          name: 'test-plugin',
          onInit: async () => {
            initCalled = true;
          },
        }),
      })
    );

    expect(initCalled).toBe(true);
    expect(cli.plugins.size).toBe(1);
  });

  it('calls multiple onInit hooks', async () => {
    const order: string[] = [];

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugin: [
          definePlugin({
            name: 'plugin1',
            onInit: async () => {
              order.push('plugin1');
            },
          }),
          definePlugin({
            name: 'plugin2',
            onInit: async () => {
              order.push('plugin2');
            },
          }),
        ],
      })
    );

    expect(order).toHaveLength(2);
    expect(cli.plugins.size).toBe(2);
  });

  it('allows plugins to modify CLI in onInit', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugin: definePlugin({
          name: 'test-plugin',
          onInit: async ({ cli }) => {
            const { createCommand } = await import('~/core/creation/command');
            cli.command = createCommand({
              name: 'dynamic',
              handler: async () => {},
            });
          },
        }),
      })
    );

    expect(cli.command).toBeDefined();
    expect(cli.command?.manifest.name).toBe('dynamic');
  });
});
