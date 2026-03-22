import { describe, it, expect } from "vite-plus/test";
import { packageNameSchema } from "~/std/npm";

describe("packageNameSchema", () => {
  it("parses an unscoped package name", () => {
    const result = packageNameSchema.safeParse("lodash");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ packageName: "lodash" });
  });

  it("parses a scoped package name", () => {
    const result = packageNameSchema.safeParse("@types/node");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ scopeName: "types", packageName: "node" });
  });

  it("parses a scoped package with hyphens", () => {
    const result = packageNameSchema.safeParse("@my-org/my-package");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ scopeName: "my-org", packageName: "my-package" });
  });

  it("parses a package name with underscores", () => {
    const result = packageNameSchema.safeParse("my_package");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ packageName: "my_package" });
  });

  it("parses a package name starting with a number", () => {
    const result = packageNameSchema.safeParse("7zip");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ packageName: "7zip" });
  });

  it("parses a package name with dot prefix in scoped name", () => {
    const result = packageNameSchema.safeParse("@scope/.hidden");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ scopeName: "scope", packageName: ".hidden" });
  });

  it("rejects empty string", () => {
    const result = packageNameSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects names with spaces", () => {
    expect(() => packageNameSchema.parse("my package")).toThrow("Invalid npm package name");
  });

  it("rejects names starting with a dot (unscoped)", () => {
    expect(() => packageNameSchema.parse(".hidden")).toThrow("Invalid npm package name");
  });

  it("rejects names with special characters", () => {
    expect(() => packageNameSchema.parse("my@package")).toThrow("Invalid npm package name");
  });

  it("rejects scope-only names without package", () => {
    expect(() => packageNameSchema.parse("@scope/")).toThrow("Invalid npm package name");
  });

  it("rejects names longer than 214 characters", () => {
    const result = packageNameSchema.safeParse("a".repeat(215));
    expect(result.success).toBe(false);
  });
});
