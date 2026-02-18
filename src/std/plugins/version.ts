import { createCommand } from "~/core";
import { normalizeMaybeArray } from "~/lib/js";
import { definePlugin } from "~/core/definition/plugin";
import versionCommand from "~/std/commands/version";
import helpCommand from "~/std/commands/help";
import { mergeOptionsWithVersion } from "~/std/utils/option";

export default definePlugin({
    name: "version",
    onInit: ({ cli }) => {
        if (cli.command) {
            const existingDef = cli.command.definition;
            const existingCommands = normalizeMaybeArray(existingDef.command);

            cli.command = createCommand({
                ...existingDef,
                options: mergeOptionsWithVersion(existingDef.options),
                command: [
                    ...existingCommands,
                    versionCommand,
                ],
            });
            return;
        }

        // No root command registered
        // Create one based on help command as default handler (fallback if help plugin not used)
        cli.command = createCommand({
            ...helpCommand,
            name: "root",
            paths: [],
            options: mergeOptionsWithVersion(helpCommand.options),
            command: [helpCommand, versionCommand],
        });
    },
});
