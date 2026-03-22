import { defineCommand } from "~/core/definition/command";
import helpCommand from "~/std/core/commands/help";

export default defineCommand({
  ...helpCommand,
  name: "__root__",
  paths: [],
});
