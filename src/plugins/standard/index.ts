import { createCommand, createGlobalOption } from "~/core";
import { normalizeMaybeArray } from "~/lib/js";
import { definePlugin } from "~/core/definition/plugin";
import helpCommand from "./commands/help";
import versionCommand from "./commands/version";
import helpOption from "./global-options/help";
import { mergeOptionsWithVersion } from "./utils/option";

export default definePlugin({
    name: "standard",
    onInit: ({ cli }) => {
        if (!cli.command) {
            // No root command registered — create one with help as default handler
            const options = helpCommand.options;
            cli.command = createCommand({
                ...helpCommand,
                name: "root",
                options: mergeOptionsWithVersion(options),
                command: [helpCommand, versionCommand],
            });
        } else {
            // Root command exists — add version flag and inject help/version subcommands
            const existingDef = cli.command.definition;
            const options = existingDef.options;
            const existingCommands = normalizeMaybeArray(existingDef.command);
            cli.command = createCommand({
                ...existingDef,
                options: mergeOptionsWithVersion(options),
                command: [
                    ...existingCommands,
                    helpCommand,
                    versionCommand,
                ],
            });
        }

        cli.globalOptions.add(createGlobalOption(helpOption));
    },
});
