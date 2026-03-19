import { definePlugin } from "~/core/definition/plugin";
import { showCliDeprecationWarning, showCommandDeprecationWarning } from "~/std/services/deprecation";

export default definePlugin({
    name: "deprecation",
    onInit: ({ cli }) => {
        showCliDeprecationWarning(cli);
    },
    onBeforeCommandExecution: ({ command }) => {
        showCommandDeprecationWarning(command);
    },
});
