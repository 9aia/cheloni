import type { CommandDefinition, RootCommandDefinition } from "~/core/definition/command";
import { getOptionsManifest, type OptionManifest } from "~/core/manifest/command/option";
import { getPositionalManifest, type PositionalManifest } from "~/core/manifest/command/positional";
import { getPluginsManifest, type PluginManifest } from "~/core/manifest/plugin";
import type { Manifest } from "~/utils/definition";

export interface CommandManifest extends Manifest {
  paths: string[];
  deprecated: boolean | string;
  description?: string;
  examples?: string[];
  options: OptionManifest[];
  positional?: PositionalManifest;
  plugins: PluginManifest[];
  commands: CommandManifest[];
  details?: string;
}

function defaultPathsForCommand(definition: CommandDefinition): string[] {
  if (definition.paths !== undefined && definition.paths !== null) {
    return definition.paths;
  }
  // CLI root (`defineRootCommand`) is not invoked as a "root" argv segment.
  if (definition.name === "__root__") {
    return [];
  }
  return [definition.name];
}

export function getCommandManifest(definition: CommandDefinition): CommandManifest {
  return {
    name: definition.name,
    paths: defaultPathsForCommand(definition),
    description: definition.description,
    details: definition.details,
    examples: definition.examples,
    deprecated: definition.deprecated ?? false,
    positional: definition.positional ? getPositionalManifest(definition.positional) : undefined,
    options: definition.options ? getOptionsManifest(definition.options) : [],
    plugins: definition.plugins ? getPluginsManifest(definition.plugins) : [],
    commands: definition.commands ? definition.commands.map((c) => getCommandManifest(c)) : [],
  };
}

export interface RootCommandManifest extends CommandManifest {
  name: "__root__";
}

export function getRootCommandsManifest(command: RootCommandDefinition): RootCommandManifest {
  return {
    ...getCommandManifest({
      ...command,
      name: "__root__",
    }),
    name: "__root__" as const,
  };
}
