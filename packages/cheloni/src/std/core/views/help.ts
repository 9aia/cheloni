import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { OptionManifest } from "~/core/manifest/command/option";
import type { PositionalManifest } from "~/core/manifest/command/positional";
import { findCommandInTree } from "~/utils/execution/router";

/** Command paths listed as aliases; excludes entries identical to the primary name. */
function aliasPathsForHelp(commandName: string, paths: string[] | undefined): string[] {
  if (!paths || paths.length === 0) {
    return [];
  }
  return paths.filter((p) => p !== commandName);
}

function formatDefaultValue(value: unknown): string {
  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (value === undefined) {
    return "undefined";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

interface ShowOptionHelpParams {
  option: OptionManifest;
}

function showOptionHelp({ option }: ShowOptionHelpParams): void {
  let line = `  --${option.name}`;
  if (option.aliases && option.aliases.length > 0) {
    line += `, ${option.aliases.map((a) => `-${a}`).join(", ")}`;
  }
  line += `    ${option.description || ""}`;
  console.log(line);

  if (option.deprecated) {
    const message =
      typeof option.deprecated === "string" ? option.deprecated : "This option is deprecated";
    console.log(`    Deprecated: ${message}`);
  }

  if (option.defaultValue !== undefined) {
    console.log(`    Default: ${formatDefaultValue(option.defaultValue)}`);
  }
}

interface ShowPositionalHelpParams {
  positional: PositionalManifest;
}

function showPositionalHelp({ positional }: ShowPositionalHelpParams): void {
  const label = positional.name || "positional";
  console.log(`\nPositional:`);
  console.log(`  <${label}>    ${positional.description || "(any)"}`);
  if (positional.defaultValue !== undefined) {
    console.log(`    Default: ${formatDefaultValue(positional.defaultValue)}`);
  }
  if (positional.deprecated) {
    const message =
      typeof positional.deprecated === "string"
        ? positional.deprecated
        : "This argument is deprecated";
    console.log(`    Deprecated: ${message}`);
  }
}

interface ShowCommandHelpParams {
  cli: Cli;
  commandName: string;
}

function showCommandHelp({ cli, commandName }: ShowCommandHelpParams): void {
  const cliName = cli.manifest.name;

  let actualCommand: Command | undefined;

  if (cli.command) {
    if (cli.command.manifest.name === commandName || cli.command.paths?.includes(commandName)) {
      actualCommand = cli.command;
    } else {
      actualCommand = findCommandInTree(cli.command, commandName);
    }
  }

  if (!actualCommand) {
    throw new Error(`Internal error: Command "${commandName}" not found`);
  }

  const {
    name,
    description,
    paths = [],
    deprecated,
    positional,
    options,
    examples,
  } = actualCommand.manifest;

  if (description) {
    console.log(description);
    console.log("");
  }

  const posName = positional?.name || "positional";
  const usageCommandPart = name === "__root__" ? "" : ` ${name}`;
  const usagePositionalPart = positional ? ` <${posName}>` : "";
  console.log(`Usage: ${cliName}${usageCommandPart}${usagePositionalPart} [options]\n`);

  const aliasPaths = aliasPathsForHelp(name, paths);
  if (aliasPaths.length > 0) {
    console.log(`Aliases: ${aliasPaths.join(", ")}`);
  }

  if (deprecated) {
    const message = typeof deprecated === "string" ? deprecated : "This command is deprecated";
    console.log(`Deprecated: ${message}`);
  }

  if (actualCommand.commands.size > 0) {
    console.log(`\nCommands:`);
    for (const cmd of actualCommand.commands.values()) {
      const sub = cmd.manifest;
      let cmdLine = `  ${sub.name}`;
      const subAliasPaths = aliasPathsForHelp(sub.name, sub.paths);
      if (subAliasPaths.length > 0) {
        cmdLine += ` (${subAliasPaths.join(", ")})`;
      }
      cmdLine += `    ${sub.description || ""}`;
      console.log(cmdLine);
    }
  }

  if (positional) {
    showPositionalHelp({ positional });
  }

  const hasCommandOptions = options && options.length > 0;
  const hasBequeathOptions = actualCommand.bequeathOptions.size > 0;

  if (hasCommandOptions || hasBequeathOptions) {
    console.log(`\nOptions:`);

    if (options) {
      for (const opt of options) {
        showOptionHelp({ option: opt });
      }
    }

    for (const bequeathOpt of actualCommand.bequeathOptions.values()) {
      showOptionHelp({ option: bequeathOpt.manifest });
    }
  }

  if (examples && examples.length > 0) {
    console.log(`\nExamples:`);
    for (const example of examples) {
      console.log(`  ${example}`);
    }
  }
}

interface ShowUsageParams {
  cli: Cli;
}

function showUsage({ cli }: ShowUsageParams): void {
  const rootCommand = cli.command;
  const hasCommands = rootCommand && rootCommand.commands.size > 0;
  const hasOptions =
    (rootCommand && rootCommand.bequeathOptions.size > 0) || rootCommand?.definition.options;
  const hasPositional = rootCommand && rootCommand.definition.positional;

  const usageParts = [cli.manifest.name];
  if (hasCommands) {
    usageParts.push("<command>");
  }
  if (hasOptions) {
    usageParts.push("[...options]");
  }
  if (hasPositional) {
    usageParts.push("[...args]");
  }

  console.log(`Usage: ${usageParts.join(" ")}\n`);
}

interface ShowRootHelpParams {
  cli: Cli;
}

function showRootHelp({ cli }: ShowRootHelpParams): void {
  const cliName = cli.manifest.name;
  const cliVersion = cli.manifest.version;
  const description = cli.manifest.description;
  const details = cli.manifest.details;
  const deprecated = cli.manifest.deprecated;

  showUsage({ cli });

  if (cliVersion) {
    console.log(`Version: ${cliVersion}\n`);
  }

  if (deprecated) {
    const message = typeof deprecated === "string" ? deprecated : "This CLI is deprecated";
    console.log(`Deprecated: ${message}\n`);
  }

  if (description) {
    console.log(description);
    console.log("");
  }

  const rootCommand = cli.command;
  if (rootCommand && rootCommand.commands.size > 0) {
    console.log(`Commands:`);
    for (const cmd of rootCommand.commands.values()) {
      const command = cmd.manifest;
      const name = command.name;
      const commandDescription = command.description || "";
      const paths = command.paths || [];
      const cmdDeprecated = command.deprecated;

      let cmdLine = `  ${name}`;
      const rootAliasPaths = aliasPathsForHelp(name, paths);
      if (rootAliasPaths.length > 0) {
        cmdLine += ` (${rootAliasPaths.join(", ")})`;
      }
      cmdLine += `    ${commandDescription}`;
      console.log(cmdLine);

      if (cmdDeprecated) {
        const message =
          typeof cmdDeprecated === "string" ? cmdDeprecated : "This command is deprecated";
        console.log(`    Deprecated: ${message}`);
      }
    }
  }

  if (details) {
    console.log("");
    console.log(details);
    console.log("");
  }

  console.log(`\nUse "${cliName} help <command>" for more information about a command.`);
}

interface ShowHelpParams {
  cli: Cli;
  commandName?: string;
}

export function showHelp({ cli, commandName }: ShowHelpParams): void {
  if (commandName) {
    showCommandHelp({ cli, commandName });
  } else {
    showRootHelp({ cli });
  }
}
