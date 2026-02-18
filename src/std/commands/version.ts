import { defineCommand } from "~/core/definition/command";
import { showVersion } from "~/std/services/version";

export default defineCommand({
    name: "version",
    description: "Show version",
    handler: ({ cli }) => {
        showVersion(cli.manifest);
    },
});
