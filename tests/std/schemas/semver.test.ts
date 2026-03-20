import { describe, it, expect } from "vitest";
import { semverSchema } from "~/std/schemas/semver";

describe("semverSchema", () => {
  it("accepts a stable version", async () => {
    const result = await semverSchema.safeParseAsync("1.0.0");
    expect(result.success).toBe(true);
    expect(result.data).toBe("1.0.0");
  });

  it("accepts a version with a prerelease tag", async () => {
    expect((await semverSchema.safeParseAsync("1.0.0-alpha.1")).success).toBe(true);
  });

  it("accepts a version with build metadata", async () => {
    expect((await semverSchema.safeParseAsync("1.0.0+build.123")).success).toBe(true);
  });

  it("accepts a version with prerelease and build metadata", async () => {
    expect((await semverSchema.safeParseAsync("1.0.0-beta.2+build.456")).success).toBe(true);
  });

  it("accepts a version with leading v", async () => {
    expect((await semverSchema.safeParseAsync("v1.2.3")).success).toBe(true);
  });

  it("rejects a partial version", async () => {
    expect((await semverSchema.safeParseAsync("1.0")).success).toBe(false);
  });

  it("rejects a plain number", async () => {
    expect((await semverSchema.safeParseAsync("1")).success).toBe(false);
  });

  it("rejects an empty string", async () => {
    expect((await semverSchema.safeParseAsync("")).success).toBe(false);
  });

  it("rejects arbitrary text", async () => {
    expect((await semverSchema.safeParseAsync("not-a-version")).success).toBe(false);
  });

  it("rejects non-string input", async () => {
    expect((await semverSchema.safeParseAsync(100)).success).toBe(false);
  });
});
