import { createCommand } from "~/core";
import { definePlugin } from "~/core/definition/plugin";
import dryRunOption from "~/std/global-options/dry-run";
import defaultRootCommand from "~/std/commands/default-root";

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
            ...defaultRootCommand,
            bequeathOptions: [dryRunOption],
        });
    },
});
