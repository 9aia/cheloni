import { createCommand } from "~/core";
import { definePlugin } from "~/core/definition/plugin";
import rootCommand from "~/std/core/commands/root";
import verboseOption from "~/std/logger/options/verbose";

export default definePlugin({
    name: "verbose",
    onInit: ({ cli }) => {
        if (cli.command) {
            const existingDef = cli.command.definition;
            const existingBequeathOptions = existingDef.bequeathOptions ?? [];

            cli.command = createCommand({
                ...existingDef,
                bequeathOptions: [...existingBequeathOptions, verboseOption],
            });
            return;
        }

        cli.command = createCommand({
            ...rootCommand,
            bequeathOptions: [verboseOption],
        });
    },
});
