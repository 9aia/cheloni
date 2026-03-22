import { describe, it, expect, vi } from "vite-plus/test";
import z from "zod";
import { createCli, defineCli, defineCommand, executeCommand } from "~/core";

describe("onCommandExecution execute() / halt()", () => {
  it("merges ctx into the handler context when hooks return execute", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "inject",
            onCommandExecution: async ({ execute }) => {
              return await execute({ ctx: { startTime: 42 } });
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

  it("throws if the hook neither invokes execute nor halt", async () => {
    const handler = vi.fn();
    const onHook = vi.fn();

    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "bad",
            onCommandExecution: async (params) => {
              onHook(params);
            },
          },
        ],
        command: defineCommand({
          name: "__root__",
          handler,
        }),
      }),
    );

    await expect(executeCommand({ command: cli.command!, args: [], cli })).rejects.toThrow(
      "must return execute(...) or halt()",
    );

    expect(onHook).toHaveBeenCalledOnce();
    expect(handler).not.toHaveBeenCalled();
  });

  it("return halt() stops the pipeline without running the handler", async () => {
    const handler = vi.fn();
    const onAfter = vi.fn();

    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "stop",
            onCommandExecution: async ({ halt }) => {
              try {
                return halt();
              } finally {
                onAfter();
              }
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

    expect(handler).not.toHaveBeenCalled();
    expect(onAfter).toHaveBeenCalledOnce();
  });

  it("chains multiple plugins: each execute continues with merged ctx", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "p1",
            onCommandExecution: async ({ execute }) => {
              return await execute({ ctx: { a: 1 } });
            },
          },
          {
            name: "p2",
            onCommandExecution: async ({ execute }) => {
              return await execute({ ctx: { b: 2 } });
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

  it("passes merged ctx from execute() for post-execute logic", async () => {
    const onAfter = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "inject",
            onCommandExecution: async ({ execute }) => {
              const ctx = await execute({ ctx: { marker: "pre" } });
              onAfter(ctx);
              return ctx;
            },
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
    expect(params).toMatchObject({ marker: "pre", flag: true });
  });

  it("throws if execute is called more than once", async () => {
    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "bad",
            onCommandExecution: async ({ execute }) => {
              await execute();
              return execute();
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
