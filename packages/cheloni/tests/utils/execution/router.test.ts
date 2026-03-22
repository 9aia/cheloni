import { describe, expect, it } from "vite-plus/test";
import { findCommandInTree } from "~/utils/execution";

function cmd(name: string, children: any[] = [], paths: string[] = []) {
  return {
    manifest: { name },
    paths,
    commands: new Map(children.map((c) => [c.manifest.name, c])),
  };
}

describe("utils/execution/findCommandInTree", () => {
  it("finds direct child by manifest.name", () => {
    const leaf = cmd("leaf");
    const root = cmd("__root__", [leaf]);

    expect(findCommandInTree(root as any, "leaf")?.manifest.name).toBe("leaf");
  });

  it("finds direct child by paths entry", () => {
    const leaf = cmd("leaf", [], ["l"]);
    const root = cmd("__root__", [leaf]);

    expect(findCommandInTree(root as any, "l")?.manifest.name).toBe("leaf");
  });

  it("finds deep descendant by name", () => {
    const deep = cmd("deep");
    const mid = cmd("mid", [deep]);
    const root = cmd("__root__", [mid]);

    expect(findCommandInTree(root as any, "deep")?.manifest.name).toBe("deep");
  });

  it("returns undefined when not found", () => {
    const root = cmd("__root__", [cmd("a"), cmd("b")]);
    expect(findCommandInTree(root as any, "nope")).toBeUndefined();
  });
});
