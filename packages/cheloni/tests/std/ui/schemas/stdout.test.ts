import { describe, it, expect } from "vite-plus/test";
import { jsonOptionSchema, prettyOptionSchema } from "~/std/ui";

describe("jsonOptionSchema", () => {
  it("accepts true", () => {
    const result = jsonOptionSchema.safeParse(true);
    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });

  it("accepts false", () => {
    const result = jsonOptionSchema.safeParse(false);
    expect(result.success).toBe(true);
    expect(result.data).toBe(false);
  });

  it("accepts undefined (optional)", () => {
    const result = jsonOptionSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it("rejects non-boolean values", () => {
    expect(jsonOptionSchema.safeParse("true").success).toBe(false);
    expect(jsonOptionSchema.safeParse(1).success).toBe(false);
  });

  it("has a description in meta", () => {
    const meta = jsonOptionSchema.meta();
    expect(meta?.description).toBeDefined();
  });
});

describe("prettyOptionSchema", () => {
  it("accepts true", () => {
    const result = prettyOptionSchema.safeParse(true);
    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });

  it("accepts false", () => {
    const result = prettyOptionSchema.safeParse(false);
    expect(result.success).toBe(true);
    expect(result.data).toBe(false);
  });

  it("defaults to false when undefined", () => {
    const result = prettyOptionSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBe(false);
  });

  it("rejects non-boolean values", () => {
    expect(prettyOptionSchema.safeParse("pretty").success).toBe(false);
    expect(prettyOptionSchema.safeParse(0).success).toBe(false);
  });
});
