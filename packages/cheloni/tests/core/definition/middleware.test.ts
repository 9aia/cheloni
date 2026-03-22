import type { UnknownRecord } from "type-fest";
import { describe, expectTypeOf, it } from "vite-plus/test";
import { defineMiddleware, type Middleware } from "~/core";

describe("defineMiddleware — ctx type inference", () => {
  it("infers ctx from a single middleware via next({ ctx })", () => {
    const helpMiddleware = defineMiddleware(async ({ next }) => {
      return await next({
        ctx: {
          help: true,
        },
      });
    });

    expectTypeOf(helpMiddleware).toEqualTypeOf<Middleware<{ help: boolean }>>();
  });

  it("uses an unknown record ctx when there is no middleware", () => {
    const middleware = defineMiddleware(async ({ next }) => next());
    expectTypeOf(middleware).toEqualTypeOf<Middleware<UnknownRecord>>();
  });
});
