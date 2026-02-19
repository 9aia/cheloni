import { defineCommand } from "~/core/definition/command";
import { showHelp } from "~/std/services/help";
import { helpPositionalSchema } from "../schemas/help";

export default defineCommand({
    name: "help",
    description: "Show help",
    positional: helpPositionalSchema,
    handler: ({ cli, positional }) => {
        const commandName = positional;
        showHelp(cli, commandName);
    },
});
