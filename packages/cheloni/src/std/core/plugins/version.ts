import { createCommand } from "~/core";
import { definePlugin } from "~/core/definition/plugin";
import helpCommand from "~/std/core/commands/help";
import rootCommand from "~/std/core/commands/root";
import versionCommand from "~/std/core/commands/version";
import { mergeOptionsWithVersion } from "~/std/core/utils/option";

export default definePlugin({
  name: "version",
  onInit: ({ cli }) => {
    if (cli.command) {
      const existingDef = cli.command.definition;
      const existingCommands = existingDef.commands ?? [];

      cli.command = createCommand({
        ...existingDef,
        options: mergeOptionsWithVersion(existingDef.options),
        commands: [...existingCommands, versionCommand],
      });
      return;
    }

    cli.command = createCommand({
      ...rootCommand,
      options: mergeOptionsWithVersion(helpCommand.options),
      commands: [versionCommand],
    });
  },
});
