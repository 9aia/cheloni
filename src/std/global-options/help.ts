import { defineGlobalOption } from "~/core/definition/command/global-option";
import { showHelp } from "~/std/services/help";
import { helpOptionSchema } from "~/std/schemas/help";

export default defineGlobalOption({
    name: "help",
    schema: helpOptionSchema,
    handler: ({ command, cli, halt }) => {
        showHelp(cli, command.manifest.name);
        halt();
    },
});
