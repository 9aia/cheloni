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

    const _typed: Middleware<{ help: true }> = helpMiddleware;
    expectTypeOf(helpMiddleware).toEqualTypeOf(_typed);
  });

  it("uses an unknown record ctx when there is no middleware", () => {
    const middleware = defineMiddleware(async ({ next }) => next());
    const _typed: Middleware<UnknownRecord> = middleware;
    expectTypeOf(middleware).toEqualTypeOf(_typed);
  });
});
