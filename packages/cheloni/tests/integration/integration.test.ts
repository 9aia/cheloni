import { describe, it, expect, vi } from "vite-plus/test";
import z from "zod";
import { createCli, defineCli, defineCommand, executeCli } from "~/core";

describe("Integration Tests", () => {
  it("executes complete CLI workflow", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test-cli",
        version: "1.0.0",
        description: "Test CLI",
        command: defineCommand({
          name: "__root__",
          commands: [
            defineCommand({
              name: "greet",
              paths: ["g", "greet"],
              description: "Greet someone",
              positional: z.string().describe("name"),
              options: z.object({
                verbose: z.boolean().optional().describe("verbose output"),
                count: z.number().default(1).describe("number of times"),
              }),
              handler,
            }),
          ],
        }),
      }),
    );

    await executeCli({
      cli,
      args: ["greet", "Alice", "--verbose", "--count", "3"],
    });

    expect(handler).toHaveBeenCalledOnce();
    const params = handler.mock.calls[0]![0];
    expect(params.positional).toBe("Alice");
    expect(params.options.verbose).toBe(true);
    expect(params.options.count).toBe(3);
  });

  it("handles middleware chain", async () => {
    const order: string[] = [];
    let capturedContext: any;
    const handler = vi.fn((params: any) => {
      order.push("handler");
      capturedContext = params;
    });

    const cli = await createCli(
      defineCli({
        name: "test-cli",
        command: defineCommand({
          name: "__root__",
          commands: [
            defineCommand({
              name: "test",
              paths: ["test"],
              middleware: [
                async ({ next }) => {
                  order.push("middleware1");
                  return next();
                },
                async ({ next }) => {
                  order.push("middleware2");
                  return next({ ctx: { value: "test" } });
                },
              ],
              handler,
            }),
          ],
        }),
      }),
    );

    await executeCli({ cli, args: ["test"] });

    expect(order).toEqual(["middleware1", "middleware2", "handler"]);
    expect(handler).toHaveBeenCalledOnce();
    expect(capturedContext).toBeDefined();
    expect(capturedContext?.ctx.value).toBe("test");
  });

  it("handles plugin lifecycle", async () => {
    const lifecycle: string[] = [];
    const handler = vi.fn(() => {
      lifecycle.push("handler");
    });

    const cli = await createCli(
      defineCli({
        name: "test-cli",
        plugins: [
          {
            name: "test-plugin",
            onInit: async () => {
              lifecycle.push("onInit");
            },
            onCommandExecution: async ({ execute }) => {
              lifecycle.push("onBeforeCommand");
              const result = await execute();
              lifecycle.push("onAfterCommand");
              return result;
            },
            onDestroy: async () => {
              lifecycle.push("onDestroy");
            },
          },
        ],
        command: defineCommand({
          name: "__root__",
          commands: [
            defineCommand({
              name: "test",
              paths: ["test"],
              handler,
            }),
          ],
        }),
      }),
    );

    await executeCli({ cli, args: ["test"] });

    expect(lifecycle).toEqual([
      "onInit",
      "onBeforeCommand",
      "handler",
      "onAfterCommand",
      "onDestroy",
    ]);
  });

  it("validates and rejects invalid positional", async () => {
    const handler = vi.fn();
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    const cli = await createCli(
      defineCli({
        name: "test-cli",
        command: defineCommand({
          name: "__root__",
          commands: [
            defineCommand({
              name: "test",
              paths: ["test"],
              positional: z.string().min(5),
              handler,
            }),
          ],
        }),
      }),
    );

    await expect(executeCli({ cli, args: ["test", "abc"] })).rejects.toThrow();

    expect(handler).not.toHaveBeenCalled();
    processExitSpy.mockRestore();
  });

  it("validates and rejects invalid options", async () => {
    const handler = vi.fn();
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    const cli = await createCli(
      defineCli({
        name: "test-cli",
        command: defineCommand({
          name: "__root__",
          commands: [
            defineCommand({
              name: "test",
              paths: ["test"],
              options: z.object({
                count: z.number(),
              }),
              handler,
            }),
          ],
        }),
      }),
    );

    await expect(executeCli({ cli, args: ["test", "--count", "invalid"] })).rejects.toThrow();

    expect(handler).not.toHaveBeenCalled();
    processExitSpy.mockRestore();
  });

  it("handles multiple nested commands with different paths", async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const cli = await createCli(
      defineCli({
        name: "test-cli",
        command: defineCommand({
          name: "__root__",
          commands: [
            defineCommand({
              name: "cmd1",
              paths: ["a", "alpha"],
              handler: handler1,
            }),
            defineCommand({
              name: "cmd2",
              paths: ["b", "beta"],
              handler: handler2,
            }),
          ],
        }),
      }),
    );

    await executeCli({ cli, args: ["a"] });
    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).not.toHaveBeenCalled();

    handler1.mockClear();
    handler2.mockClear();

    await executeCli({ cli, args: ["beta"] });
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("handles extrageous options with filter-out", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test-cli",
        command: defineCommand({
          name: "__root__",
          commands: [
            defineCommand({
              name: "test",
              paths: ["test"],
              options: z.object({
                verbose: z.boolean().optional(),
              }),
              throwOnExtrageousOptions: "filter-out",
              handler,
            }),
          ],
        }),
      }),
    );

    await executeCli({ cli, args: ["test", "--verbose", "--unknown"] });

    expect(handler).toHaveBeenCalledOnce();
    const params = handler.mock.calls[0]![0];
    expect(params.options.verbose).toBe(true);
    expect(params.options.unknown).toBeUndefined();
  });

  it("handles command-level plugins", async () => {
    const globalHook = vi.fn();
    const commandHook = vi.fn();
    const handler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: "test-cli",
        plugins: [
          {
            name: "global",
            onCommandExecution: async (params) => {
              globalHook(params);
              return params.execute();
            },
          },
        ],
        command: defineCommand({
          name: "__root__",
          commands: [
            defineCommand({
              name: "test",
              paths: ["test"],
              plugins: [
                {
                  name: "command",
                  onCommandExecution: async (params) => {
                    commandHook(params);
                    return params.execute();
                  },
                },
              ],
              handler,
            }),
          ],
        }),
      }),
    );

    await executeCli({ cli, args: ["test"] });

    expect(globalHook).toHaveBeenCalledOnce();
    expect(commandHook).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledOnce();
  });
});
