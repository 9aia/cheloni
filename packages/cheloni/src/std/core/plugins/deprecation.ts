import { definePlugin } from "~/core/definition/plugin";
import {
  showCliDeprecationWarning,
  showCommandDeprecationWarning,
  showOptionDeprecationWarnings,
  showPositionalDeprecationWarning,
} from "~/std/core/views/deprecation";

export default definePlugin({
  name: "deprecation",
  onInit: ({ cli }) => {
    showCliDeprecationWarning({ cli });
  },
  onCommandExecution: ({ command, parsedOptions, parsedPositionals, execute }) => {
    showCommandDeprecationWarning({ command });
    showOptionDeprecationWarnings({ command, parsedOptions });
    showPositionalDeprecationWarning({ command, parsedPositionals });
    return execute();
  },
});
