import { createCommand } from "~/core";
import { definePlugin } from "~/core/definition/plugin";
import versionCommand from "~/std/commands/version";
import helpCommand from "~/std/commands/help";
import { mergeOptionsWithVersion } from "~/std/utils/option";
import rootCommand from "~/std/commands/root";

export default definePlugin({
    name: "version",
    onInit: ({ cli }) => {
        if (cli.command) {
            const existingDef = cli.command.definition;
            const existingCommands = existingDef.commands ?? [];

            cli.command = createCommand({
                ...existingDef,
                options: mergeOptionsWithVersion(existingDef.options),
                commands: [
                    ...existingCommands,
                    versionCommand,
                ],
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
