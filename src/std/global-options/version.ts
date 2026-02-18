import z from "zod";
import { defineGlobalOption } from "~/core/definition/command/global-option";
import { showVersion } from "~/std/services/version";

export default defineGlobalOption({
    name: "version",
    schema: z.boolean().optional().meta({ alias: "v" }),
    handler: ({ cli, halt }) => {
        showVersion(cli.manifest);
        halt();
    },
});
