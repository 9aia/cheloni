import { describe, expect, it } from "vite-plus/test";
import { gitRefSchema } from "~/std/git";

describe("gitRefSchema", () => {
  it("accepts a simple ref", () => {
    expect(gitRefSchema.safeParse("main").success).toBe(true);
  });

  it("accepts a namespaced ref", () => {
    expect(gitRefSchema.safeParse("refs/heads/main").success).toBe(true);
  });

  it("accepts a tag-like ref", () => {
    expect(gitRefSchema.safeParse("v1.0.0").success).toBe(true);
  });

  it("accepts a ref with hyphens and dots", () => {
    expect(gitRefSchema.safeParse("feature/my-branch.1").success).toBe(true);
  });

  it("rejects empty string", () => {
    expect(gitRefSchema.safeParse("").success).toBe(false);
  });

  it("rejects refs containing '..'", () => {
    expect(gitRefSchema.safeParse("a..b").success).toBe(false);
  });

  it("rejects refs ending with '.lock'", () => {
    expect(gitRefSchema.safeParse("branch.lock").success).toBe(false);
  });

  it("rejects refs ending with '.'", () => {
    expect(gitRefSchema.safeParse("branch.").success).toBe(false);
  });

  it("rejects refs starting with '/'", () => {
    expect(gitRefSchema.safeParse("/main").success).toBe(false);
  });

  it("rejects refs ending with '/'", () => {
    expect(gitRefSchema.safeParse("main/").success).toBe(false);
  });

  it("rejects refs with spaces", () => {
    expect(gitRefSchema.safeParse("my branch").success).toBe(false);
  });

  it("rejects refs with control characters", () => {
    expect(gitRefSchema.safeParse("main\x00").success).toBe(false);
  });

  it("rejects refs with '~', '^', ':', '?', '*', '['", () => {
    expect(gitRefSchema.safeParse("main~1").success).toBe(false);
    expect(gitRefSchema.safeParse("main^2").success).toBe(false);
    expect(gitRefSchema.safeParse("a:b").success).toBe(false);
    expect(gitRefSchema.safeParse("a?b").success).toBe(false);
    expect(gitRefSchema.safeParse("a*b").success).toBe(false);
    expect(gitRefSchema.safeParse("a[b").success).toBe(false);
  });
});
