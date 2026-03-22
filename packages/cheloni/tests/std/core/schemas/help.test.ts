import { describe, it, expect } from "vite-plus/test";
import { helpPositionalSchema, helpOptionSchema } from "~/std/core";

describe("helpPositionalSchema", () => {
  it("accepts a command name string", () => {
    const result = helpPositionalSchema.safeParse("install");
    expect(result.success).toBe(true);
    expect(result.data).toBe("install");
  });

  it("accepts undefined (optional)", () => {
    const result = helpPositionalSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it("rejects non-string values", () => {
    expect(helpPositionalSchema.safeParse(123).success).toBe(false);
    expect(helpPositionalSchema.safeParse(true).success).toBe(false);
  });

  it('has meta name "command"', () => {
    const meta = helpPositionalSchema.meta();
    expect(meta?.name).toBe("command");
  });

  it("has a description", () => {
    expect(helpPositionalSchema.description).toBeDefined();
  });
});

describe("helpOptionSchema", () => {
  it("accepts true", () => {
    const result = helpOptionSchema.safeParse(true);
    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });

  it("accepts false", () => {
    const result = helpOptionSchema.safeParse(false);
    expect(result.success).toBe(true);
    expect(result.data).toBe(false);
  });

  it("accepts undefined (optional)", () => {
    const result = helpOptionSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it("rejects non-boolean values", () => {
    expect(helpOptionSchema.safeParse("help").success).toBe(false);
    expect(helpOptionSchema.safeParse(1).success).toBe(false);
  });

  it('has alias "h"', () => {
    const meta = helpOptionSchema.meta();
    expect(meta?.aliases).toContain("h");
  });

  it("has a description", () => {
    expect(helpOptionSchema.description).toBeDefined();
  });
});
