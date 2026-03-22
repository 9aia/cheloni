import { describe, it, expect, vi } from "vite-plus/test";
import z from "zod";
import { createCli, defineCli, defineCommand, executeCommand } from "~/core";

describe("onBeforeCommandExecution execute()", () => {
  it("merges ctx into the handler context when hooks call execute", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "inject",
            onBeforeCommandExecution: async ({ execute }) => {
              await execute({ ctx: { startTime: 42 } });
            },
          },
        ],
        command: defineCommand({
          name: "__root__",
          handler,
        }),
      }),
    );

    await executeCommand({ command: cli.command!, args: [], cli });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx: expect.objectContaining({ startTime: 42 }),
      }),
    );
  });

  it("keeps backward compatibility when hooks return without calling execute", async () => {
    const handler = vi.fn();
    const onBefore = vi.fn();

    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "legacy",
            onBeforeCommandExecution: async (params) => {
              onBefore(params);
            },
          },
        ],
        command: defineCommand({
          name: "__root__",
          handler,
        }),
      }),
    );

    await executeCommand({ command: cli.command!, args: [], cli });

    expect(onBefore).toHaveBeenCalledOnce();
    expect(onBefore.mock.calls[0]![0]).toMatchObject({
      execute: expect.any(Function),
    });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("chains multiple plugins: each execute continues with merged ctx", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "p1",
            onBeforeCommandExecution: async ({ execute }) => {
              await execute({ ctx: { a: 1 } });
            },
          },
          {
            name: "p2",
            onBeforeCommandExecution: async ({ execute }) => {
              await execute({ ctx: { b: 2 } });
            },
          },
        ],
        command: defineCommand({
          name: "__root__",
          handler,
        }),
      }),
    );

    await executeCommand({ command: cli.command!, args: [], cli });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx: expect.objectContaining({ a: 1, b: 2 }),
      }),
    );
  });

  it("passes data to onAfterCommandExecution with merged options over ctx", async () => {
    const onAfter = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "inject",
            onBeforeCommandExecution: async ({ execute }) => {
              await execute({ ctx: { marker: "pre" } });
            },
            onAfterCommandExecution: onAfter,
          },
        ],
        command: defineCommand({
          name: "__root__",
          options: z.object({ flag: z.boolean().optional() }),
          handler: async () => {},
        }),
      }),
    );

    await executeCommand({
      command: cli.command!,
      args: ["--flag"],
      cli,
    });

    expect(onAfter).toHaveBeenCalledOnce();
    const params = onAfter.mock.calls[0]![0];
    expect(params.data).toMatchObject({ marker: "pre", flag: true });
  });

  it("throws if execute is called more than once", async () => {
    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "bad",
            onBeforeCommandExecution: async ({ execute }) => {
              await execute();
              await execute();
            },
          },
        ],
        command: defineCommand({
          name: "__root__",
          handler: async () => {},
        }),
      }),
    );

    await expect(executeCommand({ command: cli.command!, args: [], cli })).rejects.toThrow(
      "execute() called multiple times",
    );
  });
});
