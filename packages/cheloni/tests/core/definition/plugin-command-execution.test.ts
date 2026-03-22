import type { UnknownRecord } from "type-fest";
import { describe, expectTypeOf, it } from "vite-plus/test";
import { definePluginCommandExecutionHook } from "~/core";

describe("definePluginCommandExecutionHook — execute ctx type inference", () => {
  it("infers ctx from execute({ ctx })", () => {
    definePluginCommandExecutionHook(async ({ execute }) => {
      const ctx = await execute({
        ctx: {
          startTime: Date.now(),
        },
      });
      expectTypeOf(ctx.startTime).toEqualTypeOf<number>();
      expectTypeOf(ctx).toMatchObjectType<{ startTime: number }>();
      return ctx;
    });
  });

  it("accumulates ctx types on successive execute-shaped merges (single call)", () => {
    definePluginCommandExecutionHook(async ({ execute }) => {
      const ctx = await execute({
        ctx: {
          a: "one",
          b: 2,
        },
      });
      expectTypeOf(ctx).toMatchObjectType<{ a: string; b: number }>();
      return ctx;
    });
  });

  it("uses unknown record ctx when execute() is called with no ctx payload", () => {
    definePluginCommandExecutionHook(async ({ execute }) => {
      const ctx = await execute();
      expectTypeOf(ctx).toEqualTypeOf<UnknownRecord>();
      return ctx;
    });
  });
});
