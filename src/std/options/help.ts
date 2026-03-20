import { defineOption } from "~/core/definition/command/option";
import { helpOptionSchema } from "~/std/schemas/help";
import { showHelp } from "~/std/services/help";

export default defineOption({
    name: "help",
    schema: helpOptionSchema,
    handler: ({ command, cli, halt }) => {
        showHelp(cli, command.manifest.name);
        halt();
    },
});
