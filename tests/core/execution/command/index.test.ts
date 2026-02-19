import { describe, it, expect, vi } from 'vitest';
import z from 'zod';
import { defineCli } from '~/core/definition/cli';
import { defineCommand, defineRootCommand } from '~/core/definition/command';
import { defineGlobalOption } from '~/core/definition/command/global-option';
import { createCli } from '~/core/creation/cli';
import { executeCommand } from '~/core/execution/command';
import { InvalidPositionalError, InvalidOptionsError } from '~/core/execution/command/errors';
import { halt } from '~/core/execution/command';

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
          middleware: [
            async ({ next }) => {
              order.push('middleware');
              await next();
            },
          ],
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
        plugins: [
          {
            name: 'test-plugin',
            onPreCommandExecution: onBefore,
          },
        ],
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
        plugins: [
          {
            name: 'test-plugin',
            onAfterCommandExecution: onAfter,
          },
        ],
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
        plugins: [
          {
            name: 'global-plugin',
            onPreCommandExecution: globalHook,
          },
        ],
        command: defineCommand({
          name: 'root',
          plugins: [
            {
              name: 'command-plugin',
              onPreCommandExecution: commandHook,
            },
          ],
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
    ).resolves.toBeUndefined();
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

describe('bequeathOptions execution', () => {
  it('inherits bequeathOptions from root command to subcommand', async () => {
    const handler = vi.fn();
    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: 'sub',
              handler,
            }),
          ],
        }),
      })
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get('sub')!;

    await executeCommand({
      command: subCommand,
      args: ['--verbose'],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
  });

  it('validates bequeathOptions schema', async () => {
    const handler = vi.fn();
    const countOption = defineGlobalOption({
      name: 'count',
      schema: z.number(),
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          bequeathOptions: [countOption],
          commands: [
            defineCommand({
              name: 'sub',
              handler,
            }),
          ],
        }),
      })
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get('sub')!;

    await expect(
      executeCommand({
        command: subCommand,
        args: ['--count', 'invalid'],
        cli,
      })
    ).rejects.toThrow();
  });

  it('executes bequeathOptions handler', async () => {
    const commandHandler = vi.fn();
    const optionHandler = vi.fn();

    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
      handler: optionHandler,
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: 'sub',
              handler: commandHandler,
            }),
          ],
        }),
      })
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get('sub')!;

    await executeCommand({
      command: subCommand,
      args: ['--verbose'],
      cli,
    });

    expect(optionHandler).toHaveBeenCalledOnce();
    expect(commandHandler).toHaveBeenCalledOnce();
  });

  it('bequeathOptions handler can halt execution', async () => {
    const commandHandler = vi.fn();
    const optionHandler = vi.fn(() => {
      halt();
    });

    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
      handler: optionHandler,
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: 'sub',
              handler: commandHandler,
            }),
          ],
        }),
      })
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get('sub')!;

    await executeCommand({
      command: subCommand,
      args: ['--verbose'],
      cli,
    });

    expect(optionHandler).toHaveBeenCalledOnce();
    expect(commandHandler).not.toHaveBeenCalled();
  });

  it('inherits bequeathOptions through multiple levels', async () => {
    const handler = vi.fn();
    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: 'level1',
              commands: [
                defineCommand({
                  name: 'level2',
                  handler,
                }),
              ],
            }),
          ],
        }),
      })
    );

    const rootCommand = cli.command!;
    const level1Command = rootCommand.commands.get('level1')!;
    const level2Command = level1Command.commands.get('level2')!;

    await executeCommand({
      command: level2Command,
      args: ['--verbose'],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
  });

  it('merges bequeathOptions from multiple ancestors', async () => {
    const handler = vi.fn();
    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
    });

    const outputOption = defineGlobalOption({
      name: 'output',
      schema: z.string().optional(),
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: 'level1',
              bequeathOptions: [outputOption],
              commands: [
                defineCommand({
                  name: 'level2',
                  handler,
                }),
              ],
            }),
          ],
        }),
      })
    );

    const rootCommand = cli.command!;
    const level1Command = rootCommand.commands.get('level1')!;
    const level2Command = level1Command.commands.get('level2')!;

    await executeCommand({
      command: level2Command,
      args: ['--verbose', '--output', 'file.txt'],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
  });

  it('child bequeathOptions override parent bequeathOptions', async () => {
    const handler = vi.fn();
    const parentHandler = vi.fn();
    const childHandler = vi.fn();

    const parentOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
      handler: parentHandler,
    });

    const childOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
      handler: childHandler,
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          bequeathOptions: [parentOption],
          commands: [
            defineCommand({
              name: 'sub',
              bequeathOptions: [childOption],
              handler,
            }),
          ],
        }),
      })
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get('sub')!;

    await executeCommand({
      command: subCommand,
      args: ['--verbose'],
      cli,
    });

    expect(parentHandler).not.toHaveBeenCalled();
    expect(childHandler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('bequeathOptions work with aliases', async () => {
    const handler = vi.fn();
    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional().meta({ aliases: ['v'] }),
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: 'sub',
              handler,
            }),
          ],
        }),
      })
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get('sub')!;

    await executeCommand({
      command: subCommand,
      args: ['-v'],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
  });

  it('bequeathOptions are included in unknown option validation', async () => {
    const handler = vi.fn();
    const verboseOption = defineGlobalOption({
      name: 'verbose',
      schema: z.boolean().optional(),
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: 'sub',
              throwOnExtrageousOptions: 'throw',
              handler,
            }),
          ],
        }),
      })
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get('sub')!;

    // Should not throw because --verbose is a valid bequeathOption
    await executeCommand({
      command: subCommand,
      args: ['--verbose'],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();

    // Should throw for truly unknown option
    await expect(
      executeCommand({
        command: subCommand,
        args: ['--unknown'],
        cli,
      })
    ).rejects.toThrow(InvalidOptionsError);
  });
});

describe('bequeathOptions execution (root command)', () => {
  it('executes bequeathOptions handler', async () => {
    const commandHandler = vi.fn();
    const optionHandler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineRootCommand({
          bequeathOptions: [
            {
              name: 'verbose',
              schema: z.boolean().optional(),
              handler: optionHandler,
            },
          ],
          handler: commandHandler,
        }),
      })
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ['--verbose'],
      cli,
    });

    expect(optionHandler).toHaveBeenCalledOnce();
    expect(commandHandler).toHaveBeenCalledOnce();
  });

  it('bequeathOptions handler can halt execution', async () => {
    const commandHandler = vi.fn();
    const optionHandler = vi.fn(() => {
      halt();
    });

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineRootCommand({
          bequeathOptions: [
            {
              name: 'verbose',
              schema: z.boolean().optional(),
              handler: optionHandler,
            },
          ],
          handler: commandHandler,
        }),
      })
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ['--verbose'],
      cli,
    });

    expect(optionHandler).toHaveBeenCalledOnce();
    expect(commandHandler).not.toHaveBeenCalled();
  });

  it('validates bequeathOptions schema', async () => {
    const handler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineRootCommand({
          bequeathOptions: [
            {
              name: 'count',
              schema: z.number(),
            },
          ],
          handler,
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

  it('bequeathOptions work with aliases', async () => {
    const handler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineRootCommand({
          bequeathOptions: [
            {
              name: 'verbose',
              schema: z.boolean().optional().meta({ aliases: ['v'] }),
            },
          ],
          handler,
        }),
      })
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ['-v'],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
  });
});
