import { describe, it, expect } from 'vitest';
import { defineCli } from '~/core/definition/cli';
import { defineCommand } from '~/core/definition/command';
import { createCli } from '~/core/creation/cli';
import { executeMiddleware } from '~/core/execution/command/middleware';
import { defineMiddlewareArray } from '~/core/definition/command/middleware';

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
      middleware: [],
      command,
      cli,
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
      middleware: [
        async ({ next }) => {
          executed = true;
          return next();
        },
      ],
      command,
      cli,
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
      middleware: [
        async ({ next }) => {
          order.push(1);
          return next();
        },
        async ({ next }) => {
          order.push(2);
          return next();
        },
        async ({ next }) => {
          order.push(3);
          return next();
        },
      ],
      command,
      cli,
    });

    expect(order).toEqual([1, 2, 3]);
  });

  it('accumulates context through next({ ctx })', async () => {
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
      middleware: [
        async ({ next }) => {
          return next({ ctx: { set: 'value1' } });
        },
        async ({ next }) => {
          return next({ ctx: { added: 'value2' } });
        },
      ],
      command,
      cli,
    });

    expect(data).toEqual({ set: 'value1', added: 'value2' });
  });

  it('later middleware can see context from earlier middleware', async () => {
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
    let seenValue: unknown;

    await executeMiddleware({
      middleware: [
        async ({ next }) => {
          return next({ ctx: { user: 'alice' } });
        },
        async ({ ctx, next }) => {
          seenValue = ctx.user;
          return next();
        },
      ],
      command,
      cli,
    });

    expect(seenValue).toBe('alice');
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
      middleware: [
        async () => {
          return { ctx: {} };
        },
        async ({ next }) => {
          secondExecuted = true;
          return next();
        },
      ],
      command,
      cli,
    });

    expect(secondExecuted).toBe(false);
  });
});
