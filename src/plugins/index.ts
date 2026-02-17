// standard/
export { default as standardPlugin } from "./standard";

// standard/commands/
export { default as helpCommand } from "./standard/commands/help";
export { default as versionCommand } from "./standard/commands/version";

// standard/global-options/
export { default as helpOption } from "./standard/global-options/help";
export { default as versionOption } from "./standard/global-options/version";

// standard/services/
export { renderCommandHelp, renderRootHelp, showHelp } from "./standard/services/help";
export { showVersion } from "./standard/services/version";

// standard/utils/
export { mergeOptionsWithVersion } from "./standard/utils/option";
