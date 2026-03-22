import { describe, expect, it } from "vite-plus/test";
import { ManifestKeyedMap } from "~/utils/definition";

describe("utils/definition/ManifestKeyedMap", () => {
  it("sets by manifest.name when called with value only", () => {
    const map = new ManifestKeyedMap<any>();
    const obj = { manifest: { name: "plugin-a" }, value: 123 };

    map.set(obj);

    expect(map.get("plugin-a")).toBe(obj);
    expect(map.size).toBe(1);
  });

  it("uses value.manifest.name even when a key is provided", () => {
    const map = new ManifestKeyedMap<any>();
    const obj = { manifest: { name: "real-key" }, value: 456 };

    map.set("ignored-key", obj);

    expect(map.has("ignored-key")).toBe(false);
    expect(map.get("real-key")).toBe(obj);
    expect(map.size).toBe(1);
  });
});
