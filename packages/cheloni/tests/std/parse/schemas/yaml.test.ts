import { describe, expect, it } from "vite-plus/test";
import { yamlDataSchema } from "~/std/parse";

describe("yamlDataSchema", () => {
  it("parses a valid YAML string into an object", async () => {
    const result = await yamlDataSchema.safeParseAsync("key: value");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ key: "value" });
  });

  it("parses a YAML list", async () => {
    const result = await yamlDataSchema.safeParseAsync("- one\n- two\n- three");
    expect(result.success).toBe(true);
    expect(result.data).toEqual(["one", "two", "three"]);
  });

  it("parses nested YAML", async () => {
    const yaml = "a:\n  b:\n    c: 1";
    const result = await yamlDataSchema.safeParseAsync(yaml);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ a: { b: { c: 1 } } });
  });

  it("rejects non-string input", async () => {
    const result = await yamlDataSchema.safeParseAsync(123);
    expect(result.success).toBe(false);
  });
});
