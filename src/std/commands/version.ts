import { defineCommand } from "~/core/definition/command";
import { showVersion } from "~/std/views";

export default defineCommand({
    name: "version",
    description: "Show version",
    handler: ({ cli }) => {
        showVersion({ cliManifest: cli.manifest });
    },
});
