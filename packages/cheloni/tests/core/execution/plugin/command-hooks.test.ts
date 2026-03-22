import { describe, it, expect, vi } from "vite-plus/test";
import z from "zod";
import { createCli, defineCli, defineCommand, executeCommand } from "~/core";

describe("onBeforeCommandExecution execute() / halt()", () => {
  it("merges ctx into the handler context when hooks return execute", async () => {
    const handler = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "inject",
            onBeforeCommandExecution: async ({ execute }) => {
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
    const onBefore = vi.fn();

    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "bad",
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

    await expect(executeCommand({ command: cli.command!, args: [], cli })).rejects.toThrow(
      "must return execute(...) or halt()",
    );

    expect(onBefore).toHaveBeenCalledOnce();
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
            onBeforeCommandExecution: async ({ halt }) => {
              return halt();
            },
            onAfterCommandExecution: onAfter,
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
            onBeforeCommandExecution: async ({ execute }) => {
              return await execute({ ctx: { a: 1 } });
            },
          },
          {
            name: "p2",
            onBeforeCommandExecution: async ({ execute }) => {
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

  it("passes ctx to onAfterCommandExecution with merged options over command ctx", async () => {
    const onAfter = vi.fn();
    const cli = await createCli(
      defineCli({
        name: "test",
        plugins: [
          {
            name: "inject",
            onBeforeCommandExecution: async ({ execute }) => {
              return await execute({ ctx: { marker: "pre" } });
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
    expect(params.ctx).toMatchObject({ marker: "pre", flag: true });
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
