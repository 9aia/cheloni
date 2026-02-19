import { defineGlobalOption } from "~/core/definition/command/global-option";
import { versionOptionSchema } from "~/std/schemas/version";
import { showVersion } from "~/std/services/version";

export default defineGlobalOption({
    name: "version",
    schema: versionOptionSchema,
    handler: ({ cli, halt }) => {
        showVersion(cli.manifest);
        halt();
    },
});
