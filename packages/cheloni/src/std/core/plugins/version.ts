import { createCommand } from "~/core";
import { definePlugin } from "~/core/definition/plugin";
import rootCommand from "~/std/core/commands/root";
import versionCommand from "~/std/core/commands/version";
import versionOption from "~/std/core/options/version";

export default definePlugin({
  name: "version",
  onInit: ({ cli }) => {
    if (cli.command) {
      const existingDef = cli.command.definition;
      const existingCommands = existingDef.commands ?? [];
      const existingBequeath = existingDef.bequeathOptions ?? [];

      cli.command = createCommand({
        ...existingDef,
        bequeathOptions: [...existingBequeath, versionOption],
        commands: [...existingCommands, versionCommand],
      });
      return;
    }

    cli.command = createCommand({
      ...rootCommand,
      bequeathOptions: [versionOption],
      commands: [versionCommand],
    });
  },
});
