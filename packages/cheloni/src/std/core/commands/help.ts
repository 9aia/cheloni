import { defineCommand } from "~/core/definition/command";
import { helpPositionalSchema } from "~/std/core/schemas/help";
import { showHelp } from "~/std/core/views";

export default defineCommand({
  name: "help",
  description: "Show help",
  positional: helpPositionalSchema,
  handler: ({ cli, positional }) => {
    const commandName = positional;
    showHelp({ cli, commandName });
  },
});
