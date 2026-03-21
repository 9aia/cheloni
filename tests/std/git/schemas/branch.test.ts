import { describe, expect, it } from "vitest";
import { branchNameSchema } from "~/std/git";

describe("branchNameSchema", () => {
  it("accepts valid branch names", () => {
    expect(branchNameSchema.safeParse("main").success).toBe(true);
    expect(branchNameSchema.safeParse("feature/login").success).toBe(true);
    expect(branchNameSchema.safeParse("fix/issue-42").success).toBe(true);
  });

  it("rejects bare '@'", () => {
    expect(branchNameSchema.safeParse("@").success).toBe(false);
  });

  it("inherits gitRef restrictions", () => {
    expect(branchNameSchema.safeParse("a..b").success).toBe(false);
    expect(branchNameSchema.safeParse("").success).toBe(false);
  });
});
