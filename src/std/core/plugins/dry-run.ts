import { createCommand } from "~/core";
import { definePlugin } from "~/core/definition/plugin";
import rootCommand from "~/std/core/commands/root";
import dryRunOption from "~/std/core/options/dry-run";

export default definePlugin({
    name: "dry-run",
    onInit: ({ cli }) => {
        if (cli.command) {
            const existingDef = cli.command.definition;
            const existingBequeathOptions = existingDef.bequeathOptions ?? [];

            cli.command = createCommand({
                ...existingDef,
                bequeathOptions: [...existingBequeathOptions, dryRunOption],
            });
            return;
        }

        cli.command = createCommand({
            ...rootCommand,
            bequeathOptions: [dryRunOption],
        });
    },
});
