import { deprecationPlugin, errorHandlerPlugin, helpPlugin, versionPlugin } from "cheloni/std/core";

export const basicPluginKit = [
  errorHandlerPlugin,
  helpPlugin,
  versionPlugin,
  deprecationPlugin,
] as const;
