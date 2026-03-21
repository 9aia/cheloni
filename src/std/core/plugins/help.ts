import { createCommand } from "~/core";
import { definePlugin } from "~/core/definition/plugin";
import helpCommand from "~/std/core/commands/help";
import rootCommand from "~/std/core/commands/root";
import helpOption from "~/std/core/options/help";

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

        cli.command = createCommand({
            ...rootCommand,
            bequeathOptions: [helpOption],
            commands: [helpCommand],
        });
    },
});
