import { describe, expect, it } from "vitest";
import { commitHashSchema, commitHashShortSchema } from "~/std/git";

describe("commitHashSchema", () => {
  it("accepts a valid 40-char lowercase hex hash", () => {
    expect(commitHashSchema.safeParse("da39a3ee5e6b4b0d3255bfef95601890afd80709").success).toBe(true);
  });

  it("accepts a valid 40-char uppercase hex hash", () => {
    expect(commitHashSchema.safeParse("DA39A3EE5E6B4B0D3255BFEF95601890AFD80709").success).toBe(true);
  });

  it("rejects a short hash", () => {
    expect(commitHashSchema.safeParse("da39a3e").success).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(commitHashSchema.safeParse("zz39a3ee5e6b4b0d3255bfef95601890afd80709").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(commitHashSchema.safeParse("").success).toBe(false);
  });
});

describe("commitHashShortSchema", () => {
  it("accepts a 7-char short hash", () => {
    expect(commitHashShortSchema.safeParse("da39a3e").success).toBe(true);
  });

  it("accepts a full 40-char hash", () => {
    expect(commitHashShortSchema.safeParse("da39a3ee5e6b4b0d3255bfef95601890afd80709").success).toBe(true);
  });

  it("accepts an intermediate-length hash", () => {
    expect(commitHashShortSchema.safeParse("da39a3ee5e6b").success).toBe(true);
  });

  it("rejects fewer than 7 characters", () => {
    expect(commitHashShortSchema.safeParse("da39a3").success).toBe(false);
  });

  it("rejects more than 40 characters", () => {
    expect(commitHashShortSchema.safeParse("a".repeat(41)).success).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(commitHashShortSchema.safeParse("zz39a3e").success).toBe(false);
  });
});
