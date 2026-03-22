import type { UnknownRecord } from "type-fest";
import { describe, expectTypeOf, it } from "vite-plus/test";
import z from "zod";
import { defineCommand, defineMiddleware, defineOption } from "~/core";

describe("defineCommand — ctx type inference (middleware)", () => {
  it("infers ctx from a single middleware via next({ ctx })", () => {
    const helpMiddleware = defineMiddleware(async ({ next }) => {
      return await next({
        ctx: {
          help: true,
        },
      });
    });

    defineCommand({
      name: "cmd",
      middleware: [helpMiddleware],
      handler: async ({ ctx }) => {
        expectTypeOf(ctx).toEqualTypeOf({ help: true } as UnknownRecord & { help: true });
      },
    });
  });

  it("intersects ctx from multiple middlewares in declaration order", () => {
    const aMiddleware = defineMiddleware(async ({ next }) => next({ ctx: { a: 1 } }));
    const bMiddleware = defineMiddleware(async ({ next }) => next({ ctx: { b: "two" } }));

    defineCommand({
      name: "cmd",
      middleware: [aMiddleware, bMiddleware],
      handler: async ({ ctx }) => {
        expectTypeOf(ctx).toEqualTypeOf({ a: 1, b: "two" } as UnknownRecord & { a: number } & {
          b: string;
        });
      },
    });
  });

  it("uses an unknown record ctx when there is no middleware", () => {
    defineCommand({
      name: "cmd",
      handler: async ({ ctx }) => {
        expectTypeOf(ctx).toEqualTypeOf({} as UnknownRecord);
      },
    });
  });
});

describe("defineCommand — positional typing", () => {
  it("infers parsed positional on the handler from the positional schema", () => {
    defineCommand({
      name: "cmd",
      positional: z.string(),
      handler: async ({ positional }) => {
        expectTypeOf(positional).toEqualTypeOf("" as string);
      },
    });
  });

  it("uses undefined positional when no positional schema is set", () => {
    defineCommand({
      name: "cmd",
      handler: async ({ positional }) => {
        expectTypeOf(positional).toEqualTypeOf(undefined as undefined);
      },
    });
  });
});

describe("defineCommand — options typing and bequeathed option next({ ctx })", () => {
  it("infers parsed options on the handler from the options schema", () => {
    defineCommand({
      name: "cmd",
      options: z.object({
        count: z.number().optional(),
        force: z.boolean(),
      }),
      handler: async ({ options }) => {
        expectTypeOf(options).toEqualTypeOf({
          count: 0 as number | undefined,
          force: true as boolean,
        });
      },
    });
  });

  it("infers option value in defineOption handler and returns next({ ctx })", () => {
    const flag = defineOption({
      name: "flag",
      schema: z.boolean().optional(),
      handler: async ({ value, next }) => {
        expectTypeOf(value).toEqualTypeOf(undefined as boolean | undefined);
        return next({ ctx: { fromOption: value === true } });
      },
    });

    defineCommand({
      name: "root",
      bequeathOptions: [flag],
      commands: [
        defineCommand({
          name: "sub",
          handler: async () => {},
        }),
      ],
    });
  });
});
