import { describe, expect, it } from "vite-plus/test";
import { gitTagSchema } from "~/std/git";

describe("gitTagSchema", () => {
  it("accepts a simple tag", () => {
    expect(gitTagSchema.safeParse("v1.0.0").success).toBe(true);
  });

  it("accepts a tag with hyphens and dots", () => {
    expect(gitTagSchema.safeParse("release-1.2.3").success).toBe(true);
  });

  it("accepts a plain name", () => {
    expect(gitTagSchema.safeParse("latest").success).toBe(true);
  });

  it("rejects tags containing '/'", () => {
    expect(gitTagSchema.safeParse("refs/tags/v1").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(gitTagSchema.safeParse("").success).toBe(false);
  });

  it("rejects tags containing '..'", () => {
    expect(gitTagSchema.safeParse("v1..0").success).toBe(false);
  });

  it("rejects tags ending with '.lock'", () => {
    expect(gitTagSchema.safeParse("v1.lock").success).toBe(false);
  });

  it("rejects tags ending with '.'", () => {
    expect(gitTagSchema.safeParse("v1.").success).toBe(false);
  });

  it("rejects tags with spaces", () => {
    expect(gitTagSchema.safeParse("my tag").success).toBe(false);
  });

  it("rejects tags with forbidden characters", () => {
    expect(gitTagSchema.safeParse("v1~0").success).toBe(false);
    expect(gitTagSchema.safeParse("v1^0").success).toBe(false);
    expect(gitTagSchema.safeParse("v1:0").success).toBe(false);
    expect(gitTagSchema.safeParse("v1?0").success).toBe(false);
    expect(gitTagSchema.safeParse("v1*0").success).toBe(false);
    expect(gitTagSchema.safeParse("v1[0").success).toBe(false);
  });
});
