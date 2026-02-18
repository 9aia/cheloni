import z from "zod";
import { defineGlobalOption } from "~/core/definition/command/global-option";
import { showHelp } from "~/std/services/help";

export default defineGlobalOption({
    name: "help",
    schema: z.boolean().optional().meta({ alias: "h" }),
    handler: ({ command, cli, halt }) => {
        showHelp(cli, command.manifest.name);
        halt();
    },
});
