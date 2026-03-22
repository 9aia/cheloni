import { defineOption } from "~/core/definition/command/option";
import { helpOptionSchema } from "~/std/core/schemas/help";
import { showHelp } from "~/std/core/views";

export default defineOption({
  name: "help",
  schema: helpOptionSchema,
  handler: ({ command, cli, halt }) => {
    showHelp({ cli, commandName: command.manifest.name });
    return halt();
  },
});
