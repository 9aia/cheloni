import { createCommand } from "~/core";
import { definePlugin } from "~/core/definition/plugin";
import verboseOption from "~/std/global-options/verbose";
import defaultRootCommand from "~/std/commands/default-root";

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
            ...defaultRootCommand,
            bequeathOptions: [verboseOption],
        });
    },
});
