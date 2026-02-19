import { defineCommand } from "~/core/definition/command";
import helpCommand from "./help";

export default defineCommand({
    ...helpCommand,
    name: "root",
    paths: [],
});
