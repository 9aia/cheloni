import z from "zod";
import { defineGlobalOption } from "~/core/definition/command/global-option";
import { renderCommandHelp } from "~/plugins/standard/services/help";

export default defineGlobalOption({
    name: "help",
    schema: z.boolean().meta({ alias: "h" }),
    handler: ({ command, cli }) => {
        renderCommandHelp(cli, command.manifest.name);
    },
});
