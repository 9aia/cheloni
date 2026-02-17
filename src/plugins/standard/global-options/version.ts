import z from "zod";
import { defineGlobalOption } from "~/core/definition/command/global-option";
import { showVersion } from "~/plugins/standard/services/version";

export default defineGlobalOption({
    name: "version",
    schema: z.boolean(),
    validate: false,
    handler: ({ command }) => {
        showVersion(command.manifest);
    },
});
