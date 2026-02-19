// Commands
export { default as helpCommand } from "./commands/help";
export { default as versionCommand } from "./commands/version";

// Global Options
export { default as helpOption } from "./global-options/help";
export { default as configOption } from "./global-options/config";
export { default as verboseOption } from "./global-options/verbose";
export { default as versionOption } from "./global-options/version";
export { default as dryRunOption } from "./global-options/dry-run";
export { default as jsonOption } from "./global-options/json";

// Services
export {
    showHelp
} from "./services/help";
export { showVersion } from "./services/version";
export { resolveConfig, type ConfigResolutionResult } from "./services/config";

// Utils
export { mergeOptionsWith, mergeOptionsWithVersion } from "./utils/option";
export {
    getLocalConfigPath,
    getGlobalConfigPath,
    loadConfigForCli,
    type ConfigScope,
    type ConfigFileDescriptor,
    type LoadedConfigFile,
    type ResolvedConfig,
} from "./utils/config";

// Schemas
export { helpPositionalSchema, helpOptionSchema } from "./schemas/help";
export { versionOptionSchema } from "./schemas/version";
export { configOptionSchema } from "./schemas/config";
export { dryRunOptionSchema } from "./schemas/dry-run";
export { pathSchema, outputOptionSchema } from "./schemas/file";
export { forceOptionSchema } from "./schemas/force";
export { jsonOptionSchema, prettyOptionSchema } from "./schemas/out";
export { interactiveOptionSchema } from "./schemas/interactive";

// Plugins
export { default as helpPlugin } from "./plugins/help";
export { default as configPlugin } from "./plugins/config";
export { default as verbosePlugin } from "./plugins/verbose";
export { default as versionPlugin } from "./plugins/version";
export { default as dryRunPlugin } from "./plugins/dry-run";

// Pluginpacks
export { default as basePluginpack } from "./packs/base";
