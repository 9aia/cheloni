import { createCommand, createGlobalOption } from "~/core";
import { normalizeMaybeArray } from "~/lib/js";
import { definePlugin } from "~/core/definition/plugin";
import helpCommand from "~/std/commands/help";
import helpOption from "~/std/global-options/help";

export default definePlugin({
    name: "help",
    onInit: ({ cli }) => {
        cli.globalOptions.add(createGlobalOption(helpOption));

        if (cli.command) {
            const existingDef = cli.command.definition;
            const existingCommands = normalizeMaybeArray(existingDef.command);

            cli.command = createCommand({
                ...existingDef,
                command: [
                    ...existingCommands,
                    helpCommand,
                ],
            });
            return;
        }

        // No root command registered
        // Create one based on help command as default handler
        cli.command = createCommand({
            ...helpCommand,
            name: "root",
            paths: [],
            command: [helpCommand],
        });
    },
});
