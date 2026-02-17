import { defineCommand } from "~/core/definition/command";
import { showVersion } from "~/plugins/standard/services/version";

export default defineCommand({
    name: "version",
    description: "Show version",
    handler: ({ command }) => {
        showVersion(command.manifest);
    },
});
