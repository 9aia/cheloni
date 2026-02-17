import { createCommand, createGlobalOption } from "~/core";
import { definePlugin } from "~/core/definition/plugin";
import helpCommand from "./commands/help";
import versionCommand from "./commands/version";
import helpOption from "./global-options/help";
import { mergeOptionsWithVersion } from "./utils/option";

export default definePlugin({
    name: "standard",
    onInit: ({ cli }) => {
        const rootCommand = cli.rootCommands.get("root");

        // If root command is not registered, set help as default
        if (!rootCommand) {
            const options = helpCommand.options;
            cli.rootCommands.add(createCommand({
                ...helpCommand,
                name: "root",
                options: mergeOptionsWithVersion(options),
            }));
        } else {
            // Add version flag to root command
            const options = rootCommand.definition.options;
            cli.rootCommands.add(createCommand({
                ...rootCommand.definition,
                options: mergeOptionsWithVersion(options),
            }));
        }

        cli.rootCommands.add(createCommand(helpCommand));
        cli.rootCommands.add(createCommand(versionCommand));

        cli.globalOptions.add(createGlobalOption(helpOption));
    },
});
