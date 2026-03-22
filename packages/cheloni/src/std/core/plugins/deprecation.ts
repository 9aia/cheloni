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
  onBeforeCommandExecution: ({ command, parsedOptions, parsedPositionals }) => {
    showCommandDeprecationWarning({ command });
    showOptionDeprecationWarnings({ command, parsedOptions });
    showPositionalDeprecationWarning({ command, parsedPositionals });
  },
});
