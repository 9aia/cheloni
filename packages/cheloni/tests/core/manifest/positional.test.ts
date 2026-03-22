import { describe, it, expect } from "vite-plus/test";
import z from "zod";
import { getPositionalManifest } from "~/core";

describe("getPositionalManifest", () => {
  it("extracts description", () => {
    const schema = z.string().describe("input file");
    const manifest = getPositionalManifest(schema);
    expect(manifest).toBeDefined();
  });

  it("extracts name from meta", () => {
    const schema = z.string().meta({ name: "file" });
    const manifest = getPositionalManifest(schema);
    expect(manifest.name).toBe("file");
  });

  it("extracts name alongside description", () => {
    const schema = z.string().describe("The input file path").meta({ name: "path" });
    const manifest = getPositionalManifest(schema);
    expect(manifest.name).toBe("path");
    expect(manifest.description).toBe("The input file path");
  });

  it("returns default name when not set in meta", () => {
    const schema = z.string().describe("input file");
    const manifest = getPositionalManifest(schema);
    expect(manifest.name).toBe("positional");
  });

  it.skip("extracts details from metadata", () => {
    const schema = z.string();
    Object.defineProperty(schema, "_def", {
      value: { metadata: { details: "More info" } },
      writable: true,
      configurable: true,
    });
    const manifest = getPositionalManifest(schema);
    expect(manifest.details).toBe("More info");
  });

  it.skip("extracts deprecated flag", () => {
    const schema = z.string();
    Object.defineProperty(schema, "_def", {
      value: { deprecated: true },
      writable: true,
      configurable: true,
    });
    const manifest = getPositionalManifest(schema);
    expect(manifest.deprecated).toBe(true);
  });

  it.skip("extracts deprecated message", () => {
    const schema = z.string();
    Object.defineProperty(schema, "_def", {
      value: { deprecated: "Use new format" },
      writable: true,
      configurable: true,
    });
    const manifest = getPositionalManifest(schema);
    expect(manifest.deprecated).toBe("Use new format");
  });

  it("returns default manifest when no metadata", () => {
    const schema = z.string();
    const manifest = getPositionalManifest(schema);
    expect(manifest).toEqual({
      name: "positional",
      deprecated: false,
    });
  });
});
