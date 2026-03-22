import { describe, it, expectTypeOf } from "vite-plus/test";
import z from "zod";
import { defineCommand, defineMiddleware, defineOption } from "~/core";
import type { OptionsSchema } from "~/core/definition/command/option";
import type { PositionalDefinition } from "~/core/definition/command/positional";

/** Command handler `ctx` type from a `defineCommand` return type (middleware tuple must be explicit). */
type CommandHandlerCtx<TDef extends { handler?: (...args: any) => any }> = Parameters<
  NonNullable<TDef["handler"]>
>[0]["ctx"];

describe("defineCommand — ctx type inference (middleware)", () => {
  it("infers ctx from a single middleware via next({ ctx })", () => {
    const helpMw = defineMiddleware<{ help: true }>(async ({ next }) =>
      next({ ctx: { help: true } }),
    );

    const def = defineCommand<PositionalDefinition, OptionsSchema, [typeof helpMw]>({
      name: "cmd",
      middleware: [helpMw],
      handler: async ({ ctx }) => {
        expectTypeOf(ctx).toEqualTypeOf<{ help: true }>();
      },
    });

    expectTypeOf<CommandHandlerCtx<typeof def>>().toEqualTypeOf<{ help: true }>();
  });

  it("intersects ctx from multiple middlewares in declaration order", () => {
    const mwA = defineMiddleware<{ a: 1 }>(async ({ next }) => next({ ctx: { a: 1 as const } }));
    const mwB = defineMiddleware<{ b: "two" }>(async ({ next }) =>
      next({ ctx: { b: "two" as const } }),
    );

    const def = defineCommand<PositionalDefinition, OptionsSchema, [typeof mwA, typeof mwB]>({
      name: "cmd",
      middleware: [mwA, mwB],
      handler: async ({ ctx }) => {
        expectTypeOf(ctx).toEqualTypeOf<{ a: 1; b: "two" }>();
      },
    });

    expectTypeOf<CommandHandlerCtx<typeof def>>().toEqualTypeOf<{ a: 1; b: "two" }>();
  });

  it("uses an empty ctx object when there is no middleware", () => {
    const def = defineCommand({
      name: "cmd",
      handler: async ({ ctx }) => {
        expectTypeOf(ctx).toEqualTypeOf<{}>();
      },
    });

    expectTypeOf<CommandHandlerCtx<typeof def>>().toEqualTypeOf<{}>();
  });
});

describe("defineCommand — options typing and bequeathed option next({ ctx })", () => {
  it("infers parsed options on the handler from the options schema", () => {
    const def = defineCommand({
      name: "cmd",
      options: z.object({
        count: z.number().optional(),
        force: z.boolean(),
      }),
      handler: async ({ options }) => {
        expectTypeOf(options).toEqualTypeOf<{ count?: number; force: boolean }>();
      },
    });

    type Opt = Parameters<NonNullable<typeof def.handler>>[0]["options"];
    expectTypeOf<Opt>().toEqualTypeOf<{ count?: number; force: boolean }>();
  });

  it("infers option value in defineOption handler and returns next({ ctx })", () => {
    const flag = defineOption({
      name: "flag",
      schema: z.boolean().optional(),
      handler: async ({ value, next }) => {
        expectTypeOf(value).toEqualTypeOf<boolean | undefined>();
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
