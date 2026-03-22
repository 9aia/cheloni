import { describe, it, expect } from "vite-plus/test";
import { defineCli, defineCommand, getCliManifest } from "~/core";

describe("getCliManifest", () => {
  it("extracts basic CLI manifest", () => {
    const definition = defineCli({
      name: "test-cli",
      version: "1.0.0",
      description: "Test CLI",
    });

    const manifest = getCliManifest(definition);
    expect(manifest.name).toBe("test-cli");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.description).toBe("Test CLI");
  });

  it("includes details and deprecated flag", () => {
    const definition = defineCli({
      name: "test-cli",
      details: "More details",
      deprecated: "Use new-cli instead",
    });

    const manifest = getCliManifest(definition);
    expect(manifest.details).toBe("More details");
    expect(manifest.deprecated).toBe("Use new-cli instead");
  });

  it("includes root command manifest", () => {
    const definition = defineCli({
      name: "test-cli",
      command: defineCommand({
        name: "__root__",
        handler: async () => {},
      }),
    });

    const manifest = getCliManifest(definition);
    expect(manifest.command).toBeDefined();
    expect(manifest.command?.name).toBe("__root__");
  });

  it("includes nested command manifests", () => {
    const definition = defineCli({
      name: "test-cli",
      command: defineCommand({
        name: "__root__",
        commands: [
          defineCommand({
            name: "cmd1",
            handler: async () => {},
          }),
          defineCommand({
            name: "cmd2",
            handler: async () => {},
          }),
        ],
      }),
    });

    const manifest = getCliManifest(definition);
    expect(manifest.command).toBeDefined();
    expect(manifest.command?.commands).toHaveLength(2);
    expect(manifest.command?.commands?.map((c) => c.name)).toEqual(["cmd1", "cmd2"]);
  });

  it("handles no command", () => {
    const definition = defineCli({
      name: "test-cli",
    });

    const manifest = getCliManifest(definition);
    expect(manifest.command).toBeUndefined();
  });
});
