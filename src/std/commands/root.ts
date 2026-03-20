import { defineCommand } from "~/core/definition/command";
import helpCommand from "~/std/commands/help";

export default defineCommand({
    ...helpCommand,
    name: "root",
    paths: [],
});
