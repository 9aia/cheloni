import { deprecationPlugin, errorHandlerPlugin, helpPlugin, versionPlugin } from "~/std/core";

/**
 * Basic plugin kit: error handling, help/version, deprecation warnings.
 */
export const basicPluginKit = [
  errorHandlerPlugin,
  helpPlugin,
  versionPlugin,
  deprecationPlugin,
] as const;
