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
  onCommandExecution: ({ commandDefinition, parsedOptions, parsedPositionals, execute }) => {
    showCommandDeprecationWarning({ command: commandDefinition });
    showOptionDeprecationWarnings({ command: commandDefinition, parsedOptions });
    showPositionalDeprecationWarning({ command: commandDefinition, parsedPositionals });
    return execute();
  },
});
