import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("~/utils/definition", () => ({
  getAliasMap: vi.fn(),
}));

vi.mock("~/core/manifest/command/option", () => ({
  getOptionManifest: vi.fn(),
}));

import { getAliasMap } from "~/utils/definition";
import { getOptionManifest } from "~/core";
import { buildAliasMap } from "~/utils/execution";

describe("utils/execution/buildAliasMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges command option aliases with bequeath option aliases", () => {
    (getAliasMap as any).mockReturnValue({ verbose: ["v"] });
    (getOptionManifest as any).mockImplementation((name: string) => ({
      aliases: name === "global" ? ["g"] : [],
    }));

    const command: any = {
      bequeathOptions: new Map([["global", { definition: { name: "global", schema: undefined } }]]),
    };

    const commandDef: any = { options: {} };

    expect(buildAliasMap(commandDef, {} as any, command)).toEqual({
      verbose: ["v"],
      global: ["g"],
    });

    expect(getAliasMap).toHaveBeenCalledTimes(1);
    expect(getOptionManifest).toHaveBeenCalledWith("global", undefined);
  });

  it("works when command definition has no options", () => {
    (getAliasMap as any).mockReturnValue({ shouldNot: ["happen"] });
    (getOptionManifest as any).mockReturnValue({ aliases: ["g"] });

    const command: any = {
      bequeathOptions: new Map([["global", { definition: { name: "global", schema: undefined } }]]),
    };

    const commandDef: any = { options: undefined };

    expect(buildAliasMap(commandDef, {} as any, command)).toEqual({
      global: ["g"],
    });

    expect(getAliasMap).not.toHaveBeenCalled();
  });
});
