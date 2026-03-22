import { describe, it, expect, vi } from "vite-plus/test";
import z from "zod";
import type { OptionHandlerParams } from "~/core/creation/command/option";
import {
  createCli,
  defineCli,
  defineCommand,
  defineOption,
  defineRootCommand,
  executeCommand,
  halt,
  InvalidOptionsError,
  InvalidPositionalError,
} from "~/core";

describe("executeCommand", () => {
  it("executes handler with parsed arguments", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          positional: z.string(),
          options: z.object({
            verbose: z.boolean().optional(),
          }),
          handler,
        }),
      }),
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ["input", "--verbose"],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
    const params = handler.mock.calls[0]![0];
    expect(params.positional).toBe("input");
    expect(params.options.verbose).toBe(true);
  });

  it("validates positional argument", async () => {
    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          positional: z.string().min(5),
          handler: async () => {},
        }),
      }),
    );

    const command = cli.command!;
    await expect(
      executeCommand({
        command,
        args: ["abc"],
        cli,
      }),
    ).rejects.toThrow(InvalidPositionalError);
  });

  it("validates options", async () => {
    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          options: z.object({
            count: z.number(),
          }),
          handler: async () => {},
        }),
      }),
    );

    const command = cli.command!;
    await expect(
      executeCommand({
        command,
        args: ["--count", "invalid"],
        cli,
      }),
    ).rejects.toThrow();
  });

  it("throws on unknown options with throw behavior", async () => {
    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          options: z.object({
            verbose: z.boolean(),
          }),
          throwOnExtrageousOptions: "throw",
          handler: async () => {},
        }),
      }),
    );

    const command = cli.command!;
    await expect(
      executeCommand({
        command,
        args: ["--unknown"],
        cli,
      }),
    ).rejects.toThrow(InvalidOptionsError);
  });

  it("filters out unknown options with filter-out behavior", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          options: z.object({
            verbose: z.boolean().optional(),
          }),
          throwOnExtrageousOptions: "filter-out",
          handler,
        }),
      }),
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ["--verbose", "--unknown"],
      cli,
    });

    const params = handler.mock.calls[0]![0];
    expect(params.options.verbose).toBe(true);
    expect(params.options.unknown).toBeUndefined();
  });

  it("passes through unknown options with pass-through behavior", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          options: z.object({
            verbose: z.boolean().optional(),
          }),
          throwOnExtrageousOptions: "pass-through",
          handler,
        }),
      }),
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ["--verbose", "--unknown", "value"],
      cli,
    });

    const params = handler.mock.calls[0]![0];
    expect(params.options.verbose).toBe(true);
    expect(params.options.unknown).toBe("value");
  });

  it("executes middleware before handler", async () => {
    const order: string[] = [];
    const handler = vi.fn(() => {
      order.push("handler");
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          middleware: [
            async ({ next }) => {
              order.push("middleware");
              return next();
            },
          ],
          handler,
        }),
      }),
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: [],
      cli,
    });

    expect(order).toEqual(["middleware", "handler"]);
  });

  it("calls onBeforeCommand hooks", async () => {
    const onBefore = vi.fn();
    const handler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "test-plugin",
            onBeforeCommandExecution: onBefore,
          },
        ],
        command: defineCommand({
          name: "__root__",
          handler,
        }),
      }),
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

  it("calls onAfterCommand hooks even if handler fails", async () => {
    const onAfter = vi.fn();
    const handler = vi.fn(() => {
      throw new Error("Handler error");
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "test-plugin",
            onAfterCommandExecution: onAfter,
          },
        ],
        command: defineCommand({
          name: "__root__",
          handler,
        }),
      }),
    );

    const command = cli.command!;
    await expect(
      executeCommand({
        command,
        args: [],
        cli,
      }),
    ).rejects.toThrow("Handler error");

    expect(onAfter).toHaveBeenCalledOnce();
  });

  it("handles command-level plugins", async () => {
    const globalHook = vi.fn();
    const commandHook = vi.fn();

    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "global-plugin",
            onBeforeCommandExecution: globalHook,
          },
        ],
        command: defineCommand({
          name: "__root__",
          plugins: [
            {
              name: "command-plugin",
              onBeforeCommandExecution: commandHook,
            },
          ],
          handler: async () => {},
        }),
      }),
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

  it("handles command without handler", async () => {
    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
        }),
      }),
    );

    const command = cli.command!;
    await expect(
      executeCommand({
        command,
        args: [],
        cli,
      }),
    ).resolves.toBeUndefined();
  });

  it("handles command without positional", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          handler,
        }),
      }),
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: [],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
    const params = handler.mock.calls[0]![0];
    expect(params.positional).toBeUndefined();
  });

  it("handles command without options", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          handler,
        }),
      }),
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: [],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
    const params = handler.mock.calls[0]![0];
    expect(params.options).toEqual({});
  });
});

describe("bequeathOptions execution", () => {
  it("inherits bequeathOptions from root command to subcommand", async () => {
    const handler = vi.fn();
    const verboseOption = defineOption({
      name: "verbose",
      schema: z.boolean().optional(),
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: "sub",
              handler,
            }),
          ],
        }),
      }),
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get("sub")!;

    await executeCommand({
      command: subCommand,
      args: ["--verbose"],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
  });

  it("validates bequeathOptions schema", async () => {
    const handler = vi.fn();
    const countOption = defineOption({
      name: "count",
      schema: z.number(),
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          bequeathOptions: [countOption],
          commands: [
            defineCommand({
              name: "sub",
              handler,
            }),
          ],
        }),
      }),
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get("sub")!;

    await expect(
      executeCommand({
        command: subCommand,
        args: ["--count", "invalid"],
        cli,
      }),
    ).rejects.toThrow();
  });

  it("executes bequeathOptions handler", async () => {
    const commandHandler = vi.fn();
    const optionHandler = vi.fn(
      async ({ next }: OptionHandlerParams<z.ZodOptional<z.ZodBoolean>>) => next(),
    );

    const verboseOption = defineOption({
      name: "verbose",
      schema: z.boolean().optional(),
      handler: optionHandler,
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: "sub",
              handler: commandHandler,
            }),
          ],
        }),
      }),
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get("sub")!;

    await executeCommand({
      command: subCommand,
      args: ["--verbose"],
      cli,
    });

    expect(optionHandler).toHaveBeenCalledOnce();
    expect(commandHandler).toHaveBeenCalledOnce();
  });

  it("bequeathOptions handler merges context via next like middleware", async () => {
    const commandHandler = vi.fn();

    const aOption = defineOption({
      name: "a",
      schema: z.boolean().optional(),
      handler: async ({ next }) => next({ ctx: { fromA: 1 } }),
    });

    const bOption = defineOption({
      name: "b",
      schema: z.boolean().optional(),
      handler: async ({ ctx, next }) => next({ ctx: { fromB: ctx.fromA as number } }),
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          bequeathOptions: [aOption, bOption],
          commands: [
            defineCommand({
              name: "sub",
              handler: commandHandler,
            }),
          ],
        }),
      }),
    );

    const subCommand = cli.command!.commands.get("sub")!;

    await executeCommand({
      command: subCommand,
      args: ["--a", "--b"],
      cli,
    });

    expect(commandHandler).toHaveBeenCalledOnce();
    const params = commandHandler.mock.calls[0]![0];
    expect(params.ctx).toMatchObject({ fromA: 1, fromB: 1 });
  });

  it("bequeathOptions handler sees middleware context and can extend it", async () => {
    const commandHandler = vi.fn();

    const verboseOption = defineOption({
      name: "verbose",
      schema: z.boolean().optional(),
      handler: async ({ ctx, next }) =>
        next({ ctx: { fromOption: (ctx.fromMw as string) + "-opt" } }),
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: "sub",
              middleware: [async ({ next }) => next({ ctx: { fromMw: "mw" } })],
              handler: commandHandler,
            }),
          ],
        }),
      }),
    );

    const subCommand = cli.command!.commands.get("sub")!;

    await executeCommand({
      command: subCommand,
      args: ["--verbose"],
      cli,
    });

    expect(commandHandler).toHaveBeenCalledOnce();
    expect(commandHandler.mock.calls[0]![0].ctx).toMatchObject({
      fromMw: "mw",
      fromOption: "mw-opt",
    });
  });

  it("bequeathOptions handler can halt execution", async () => {
    const commandHandler = vi.fn();
    const optionHandler = vi.fn(() => {
      halt();
    });

    const verboseOption = defineOption({
      name: "verbose",
      schema: z.boolean().optional(),
      handler: optionHandler,
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: "sub",
              handler: commandHandler,
            }),
          ],
        }),
      }),
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get("sub")!;

    await executeCommand({
      command: subCommand,
      args: ["--verbose"],
      cli,
    });

    expect(optionHandler).toHaveBeenCalledOnce();
    expect(commandHandler).not.toHaveBeenCalled();
  });

  it("inherits bequeathOptions through multiple levels", async () => {
    const handler = vi.fn();
    const verboseOption = defineOption({
      name: "verbose",
      schema: z.boolean().optional(),
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: "level1",
              commands: [
                defineCommand({
                  name: "level2",
                  handler,
                }),
              ],
            }),
          ],
        }),
      }),
    );

    const rootCommand = cli.command!;
    const level1Command = rootCommand.commands.get("level1")!;
    const level2Command = level1Command.commands.get("level2")!;

    await executeCommand({
      command: level2Command,
      args: ["--verbose"],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
  });

  it("merges bequeathOptions from multiple ancestors", async () => {
    const handler = vi.fn();
    const verboseOption = defineOption({
      name: "verbose",
      schema: z.boolean().optional(),
    });

    const outputOption = defineOption({
      name: "output",
      schema: z.string().optional(),
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: "level1",
              bequeathOptions: [outputOption],
              commands: [
                defineCommand({
                  name: "level2",
                  handler,
                }),
              ],
            }),
          ],
        }),
      }),
    );

    const rootCommand = cli.command!;
    const level1Command = rootCommand.commands.get("level1")!;
    const level2Command = level1Command.commands.get("level2")!;

    await executeCommand({
      command: level2Command,
      args: ["--verbose", "--output", "file.txt"],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
  });

  it("child bequeathOptions override parent bequeathOptions", async () => {
    const handler = vi.fn();
    const parentHandler = vi.fn(
      async ({ next }: OptionHandlerParams<z.ZodOptional<z.ZodBoolean>>) => next(),
    );
    const childHandler = vi.fn(async ({ next }: OptionHandlerParams<z.ZodOptional<z.ZodBoolean>>) =>
      next(),
    );

    const parentOption = defineOption({
      name: "verbose",
      schema: z.boolean().optional(),
      handler: parentHandler,
    });

    const childOption = defineOption({
      name: "verbose",
      schema: z.boolean().optional(),
      handler: childHandler,
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          bequeathOptions: [parentOption],
          commands: [
            defineCommand({
              name: "sub",
              bequeathOptions: [childOption],
              handler,
            }),
          ],
        }),
      }),
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get("sub")!;

    await executeCommand({
      command: subCommand,
      args: ["--verbose"],
      cli,
    });

    expect(parentHandler).not.toHaveBeenCalled();
    expect(childHandler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledOnce();
  });

  it("bequeathOptions work with aliases", async () => {
    const handler = vi.fn();
    const verboseOption = defineOption({
      name: "verbose",
      schema: z
        .boolean()
        .optional()
        .meta({ aliases: ["v"] }),
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: "sub",
              handler,
            }),
          ],
        }),
      }),
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get("sub")!;

    await executeCommand({
      command: subCommand,
      args: ["-v"],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
  });

  it("bequeathOptions are included in unknown option validation", async () => {
    const handler = vi.fn();
    const verboseOption = defineOption({
      name: "verbose",
      schema: z.boolean().optional(),
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineCommand({
          name: "__root__",
          bequeathOptions: [verboseOption],
          commands: [
            defineCommand({
              name: "sub",
              throwOnExtrageousOptions: "throw",
              handler,
            }),
          ],
        }),
      }),
    );

    const rootCommand = cli.command!;
    const subCommand = rootCommand.commands.get("sub")!;

    // Should not throw because --verbose is a valid bequeathOption
    await executeCommand({
      command: subCommand,
      args: ["--verbose"],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();

    // Should throw for truly unknown option
    await expect(
      executeCommand({
        command: subCommand,
        args: ["--unknown"],
        cli,
      }),
    ).rejects.toThrow(InvalidOptionsError);
  });
});

describe("bequeathOptions execution (root command)", () => {
  it("executes bequeathOptions handler", async () => {
    const commandHandler = vi.fn();
    const optionHandler = vi.fn(
      async ({ next }: OptionHandlerParams<z.ZodOptional<z.ZodBoolean>>) => next(),
    );

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineRootCommand({
          bequeathOptions: [
            {
              name: "verbose",
              schema: z.boolean().optional(),
              handler: optionHandler,
            },
          ],
          handler: commandHandler,
        }),
      }),
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ["--verbose"],
      cli,
    });

    expect(optionHandler).toHaveBeenCalledOnce();
    expect(commandHandler).toHaveBeenCalledOnce();
  });

  it("bequeathOptions handler can halt execution", async () => {
    const commandHandler = vi.fn();
    const optionHandler = vi.fn(() => {
      halt();
    });

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineRootCommand({
          bequeathOptions: [
            {
              name: "verbose",
              schema: z.boolean().optional(),
              handler: optionHandler,
            },
          ],
          handler: commandHandler,
        }),
      }),
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ["--verbose"],
      cli,
    });

    expect(optionHandler).toHaveBeenCalledOnce();
    expect(commandHandler).not.toHaveBeenCalled();
  });

  it("validates bequeathOptions schema", async () => {
    const handler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineRootCommand({
          bequeathOptions: [
            {
              name: "count",
              schema: z.number(),
            },
          ],
          handler,
        }),
      }),
    );

    const command = cli.command!;
    await expect(
      executeCommand({
        command,
        args: ["--count", "invalid"],
        cli,
      }),
    ).rejects.toThrow();
  });

  it("bequeathOptions work with aliases", async () => {
    const handler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: "test",
        command: defineRootCommand({
          bequeathOptions: [
            {
              name: "verbose",
              schema: z
                .boolean()
                .optional()
                .meta({ aliases: ["v"] }),
            },
          ],
          handler,
        }),
      }),
    );

    const command = cli.command!;
    await executeCommand({
      command,
      args: ["-v"],
      cli,
    });

    expect(handler).toHaveBeenCalledOnce();
  });
});
