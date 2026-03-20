import { createCommand } from "~/core";
import { definePlugin } from "~/core/definition/plugin";
import helpCommand from "~/std/commands/help";
import helpOption from "~/std/options/help";
import rootCommand from "~/std/commands/root";

export default definePlugin({
    name: "help",
    onInit: ({ cli }) => {
        if (cli.command) {
            const existingDef = cli.command.definition;
            const existingCommands = existingDef.commands ?? [];
            const existingBequeathOptions = existingDef.bequeathOptions ?? [];

            cli.command = createCommand({
                ...existingDef,
                bequeathOptions: [...existingBequeathOptions, helpOption],
                commands: [
                    ...existingCommands,
                    helpCommand,
                ],
            });
            return;
        }

        // No root command registered
        cli.command = createCommand({
            ...rootCommand,
            bequeathOptions: [helpOption],
            commands: [helpCommand],
        });
    },
});
