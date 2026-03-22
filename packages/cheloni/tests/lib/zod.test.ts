import { describe, it, expect } from "vite-plus/test";
import z from "zod";
import { getAliasMap } from "~/utils/definition";

describe("getAliasMap", () => {
  it("returns empty object when no aliases defined", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    expect(getAliasMap(schema)).toEqual({});
  });

  it.skip("extracts alias map from object schema", () => {
    const verboseSchema = z.boolean();
    Object.defineProperty(verboseSchema, "_def", {
      value: { alias: "v" },
      writable: true,
      configurable: true,
    });

    const schema = z.object({
      verbose: verboseSchema,
      help: z.boolean(),
    });

    const aliasMap = getAliasMap(schema);
    expect(aliasMap).toEqual({ verbose: "v" });
  });

  it.skip("handles multiple aliases", () => {
    const verboseSchema = z.boolean();
    Object.defineProperty(verboseSchema, "_def", {
      value: { alias: ["v", "V"] },
      writable: true,
      configurable: true,
    });

    const schema = z.object({
      verbose: verboseSchema,
    });

    const aliasMap = getAliasMap(schema);
    expect(aliasMap).toEqual({ verbose: ["v", "V"] });
  });
});
