import { defineCommand } from "~/core/definition/command";
import helpCommand from "~/std/core/commands/help";

export default defineCommand({
    ...helpCommand,
    name: "root",
    paths: [],
});
