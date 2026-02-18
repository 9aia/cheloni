import { describe, it, expect } from 'vitest';
import { defineCli } from '~/core/definition/cli';
import { defineCommand } from '~/core/definition/command';
import { createCli } from '~/core/creation/cli';
import { executeMiddleware } from '~/core/execution/command/middleware';

describe('executeMiddleware', () => {
  it('returns empty data when no middleware', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          handler: async () => {},
        }),
      })
    );

    const command = cli.command!;
    const data = await executeMiddleware({
      middlewares: [],
      command,
    });

    expect(data).toEqual({});
  });

  it('executes single middleware', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          handler: async () => {},
        }),
      })
    );

    const command = cli.command!;
    let executed = false;

    const data = await executeMiddleware({
      middlewares: [
        async ({ next }) => {
          executed = true;
          await next();
        },
      ],
      command,
    });

    expect(executed).toBe(true);
    expect(data).toEqual({});
  });

  it('executes middleware in order', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          handler: async () => {},
        }),
      })
    );

    const command = cli.command!;
    const order: number[] = [];

    await executeMiddleware({
      middlewares: [
        async ({ next }) => {
          order.push(1);
          await next();
        },
        async ({ next }) => {
          order.push(2);
          await next();
        },
        async ({ next }) => {
          order.push(3);
          await next();
        },
      ],
      command,
    });

    expect(order).toEqual([1, 2, 3]);
  });

  it('shares data between middleware', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          handler: async () => {},
        }),
      })
    );

    const command = cli.command!;

    const data = await executeMiddleware({
      middlewares: [
        async ({ context: data, next }) => {
          data.set = 'value1';
          await next();
        },
        async ({ context: data, next }) => {
          data.added = 'value2';
          await next();
        },
      ],
      command,
    });

    expect(data).toEqual({ set: 'value1', added: 'value2' });
  });

  it('stops execution when next is not called', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          handler: async () => {},
        }),
      })
    );

    const command = cli.command!;
    let secondExecuted = false;

    await executeMiddleware({
      middlewares: [
        async () => {
        },
        async () => {
          secondExecuted = true;
        },
      ],
      command,
    });

    expect(secondExecuted).toBe(false);
  });
});
