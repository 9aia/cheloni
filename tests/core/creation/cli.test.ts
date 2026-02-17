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
    expect(cli.rootCommands.size).toBe(0);
    expect(cli.plugins.size).toBe(0);
    expect(cli.globalOptions.size).toBe(0);
  });

  it('creates commands from definitions', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      })
    );

    expect(cli.rootCommands.size).toBe(1);
    const command = [...cli.rootCommands][0];
    expect(command?.manifest.name).toBe('test');
  });

  it('creates multiple commands', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
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
      })
    );

    expect(cli.rootCommands.size).toBe(2);
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
            cli.rootCommands.add(
              createCommand({
                name: 'dynamic',
                handler: async () => {},
              })
            );
          },
        }),
      })
    );

    expect(cli.rootCommands.size).toBe(1);
    const command = [...cli.rootCommands][0];
    expect(command?.manifest.name).toBe('dynamic');
  });
});
