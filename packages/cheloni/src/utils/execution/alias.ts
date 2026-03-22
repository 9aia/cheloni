import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import { getOptionManifest } from "~/core/manifest/command/option";
import { getAliasMap } from "~/utils/definition";

export function buildAliasMap(
  commandDef: Command["definition"],
  cli: Cli,
  command: Command,
): Record<string, string[]> {
  void cli;

  const commandAliasMap = commandDef.options ? getAliasMap(commandDef.options) : {};
  const globalAliasMap: Record<string, string[]> = {};

  // Include bequeathOptions from parent commands
  for (const bequeathOpt of command.bequeathOptions.values()) {
    const manifest = getOptionManifest(bequeathOpt.definition.name, bequeathOpt.definition.schema);
    globalAliasMap[bequeathOpt.definition.name] = manifest.aliases;
  }

  return { ...commandAliasMap, ...globalAliasMap };
}
