import { defineOption } from "~/core/definition/command/option";
import { versionOptionSchema } from "~/std/schemas/version";
import { showVersion } from "~/std/views";

export default defineOption({
    name: "version",
    schema: versionOptionSchema,
    handler: ({ cli, halt }) => {
        showVersion({ cliManifest: cli.manifest });
        halt();
    },
});
