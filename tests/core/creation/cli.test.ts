import { describe, it, expect, vi } from 'vitest';
import { defineCli } from '~/core/definition/cli';
import { defineCommand, defineRootCommand } from '~/core/definition/command';
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
          commands: [
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

  it('creates root command with bequeath options', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineRootCommand({
          bequeathOptions: [
            {
              name: 'verbose',
              schema: z.boolean(),
            },
          ],
        }),
      })
    );

    expect(cli.command).toBeDefined();
    expect(cli.command!.bequeathOptions.size).toBe(1);
    const option = cli.command!.bequeathOptions.get('verbose');
    expect(option?.definition.name).toBe('verbose');
  });

  it('creates root command with multiple bequeath options', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineRootCommand({
          bequeathOptions: [
            {
              name: 'verbose',
              schema: z.boolean(),
            },
            {
              name: 'output',
              schema: z.string(),
            },
          ],
        }),
      })
    );

    expect(cli.command).toBeDefined();
    expect(cli.command!.bequeathOptions.size).toBe(2);
  });

  it('creates plugins', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          definePlugin({
            name: 'test-plugin',
          }),
        ],
      })
    );

    expect(cli.plugins.size).toBe(1);
    const plugin = [...cli.plugins.values()][0];
    expect(plugin?.manifest.name).toBe('test-plugin');
  });

  it('calls onInit hooks', async () => {
    let initCalled = false;

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          definePlugin({
            name: 'test-plugin',
            onInit: async () => {
              initCalled = true;
            },
          }),
        ],
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
        plugins: [
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
        plugins: [
          definePlugin({
            name: 'test-plugin',
            onInit: async ({ cli }) => {
              const { createCommand } = await import('~/core/creation/command');
              cli.command = createCommand({
                name: 'dynamic',
                handler: async () => {},
              });
            },
          }),
        ],
      })
    );

    expect(cli.command).toBeDefined();
    expect(cli.command?.manifest.name).toBe('dynamic');
  });

  it('creates CLI with description and details', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI description',
        details: 'More detailed information',
      })
    );

    expect(cli.manifest.description).toBe('Test CLI description');
    expect(cli.manifest.details).toBe('More detailed information');
  });

  it('handles CLI without version', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
      })
    );

    expect(cli.manifest.name).toBe('test-cli');
    expect(cli.manifest.version).toBeUndefined();
  });

  it('creates CLI with complex command tree', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'cmd1',
              commands: [
                defineCommand({
                  name: 'subcmd1',
                  handler: async () => {},
                }),
              ],
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
    const cmd1 = [...cli.command!.commands.values()].find(c => c.manifest.name === 'cmd1');
    expect(cmd1?.commands.size).toBe(1);
    const subcmd = [...cmd1!.commands.values()][0];
    expect(cmd1?.commands.has(subcmd!.manifest.name)).toBe(true);
  });

  it('creates CLI with multiple plugins in order', async () => {
    const order: string[] = [];

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
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
          definePlugin({
            name: 'plugin3',
            onInit: async () => {
              order.push('plugin3');
            },
          }),
        ],
      })
    );

    expect(order).toEqual(['plugin1', 'plugin2', 'plugin3']);
    expect(cli.plugins.size).toBe(3);
  });

  it('handles plugin onInit errors', async () => {
    await expect(
      createCli(
        defineCli({
          name: 'test-cli',
          plugins: [
            definePlugin({
              name: 'error-plugin',
              onInit: async () => {
                throw new Error('Plugin init failed');
              },
            }),
          ],
        })
      )
    ).rejects.toThrow('Plugin init failed');
  });

  it('creates CLI with bequeath options that have handlers', async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineRootCommand({
          bequeathOptions: [
            {
              name: 'verbose',
              schema: z.boolean(),
              handler,
            },
          ],
        }),
      })
    );

    expect(cli.command).toBeDefined();
    expect(cli.command!.bequeathOptions.size).toBe(1);
    const option = cli.command!.bequeathOptions.get('verbose');
    expect(option?.definition.handler).toBe(handler);
  });

  it('creates CLI with both bequeath options and plugins', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineRootCommand({
          bequeathOptions: [
            { name: 'verbose', schema: z.boolean() },
            { name: 'output', schema: z.string() },
          ],
        }),
        plugins: [
          definePlugin({ name: 'plugin1' }),
          definePlugin({ name: 'plugin2' }),
        ],
      })
    );

    expect(cli.command).toBeDefined();
    expect(cli.command!.bequeathOptions.size).toBe(2);
    expect(cli.plugins.size).toBe(2);
  });

  it('preserves command structure after plugin onInit', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        command: defineCommand({
          name: 'root',
          commands: [
            defineCommand({
              name: 'test',
              handler: async () => {},
            }),
          ],
          handler: async () => {},
        }),
        plugins: [
          definePlugin({
            name: 'modifier',
            onInit: async ({ cli }) => {
              // Plugin can access and modify command
              if (cli.command) {
                expect(cli.command.manifest.name).toBe('root');
              }
            },
          }),
        ],
      })
    );

    expect(cli.command).toBeDefined();
    expect(cli.command?.commands.size).toBe(1);
  });
});
