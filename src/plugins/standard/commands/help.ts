import { defineCommand } from "~/core/definition/command";
import { showHelp } from "~/core/execution/cli/help";
import z from "zod";

export default defineCommand({
    name: "help",
    description: "Show help",
    positional: z.string().optional().describe("Command name to show help for"),
    handler: ({ cli, positional }) => {
        const commandName = positional;
        showHelp(cli, commandName);
    },
});
