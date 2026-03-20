// Services
export { resolveConfig, type ConfigResolutionResult } from "./services/config";
export { showCliDeprecationWarning, showCommandDeprecationWarning } from "./services/deprecation";
export {
    showError, showGenericError, showInvalidSchemaError, showInvalidSchemaErrorWithIssues, showUnknownError
} from "./services/error-handling";
export {
    showHelp
} from "./services/help";
export { showVersion } from "./services/version";

// Utils
export {
    getGlobalConfigPath, getLocalConfigPath, loadConfigForCli, type ConfigFileDescriptor, type ConfigScope, type LoadedConfigFile,
    type ResolvedConfig
} from "./utils/config";
export { mergeOptionsWith, mergeOptionsWithVersion } from "./utils/option";

// Schemas
export { configOptionSchema } from "./schemas/config";
export { dryRunOptionSchema } from "./schemas/dev-tooling";
export { forceOptionSchema } from "./schemas/force";
export { helpOptionSchema, helpPositionalSchema } from "./schemas/help";
export { interactiveOptionSchema } from "./schemas/interactive";
export { outputOptionSchema, pathSchema } from "./schemas/path";
export { jsonOptionSchema, prettyOptionSchema } from "./schemas/stdout";
export { versionOptionSchema } from "./schemas/version";

// Options
export { default as configOption } from "./options/config";
export { default as dryRunOption } from "./options/dry-run";
export { default as helpOption } from "./options/help";
export { default as jsonOption } from "./options/json";
export { default as verboseOption } from "./options/verbose";
export { default as versionOption } from "./options/version";

// Commands
export { default as helpCommand } from "./commands/help";
export { default as versionCommand } from "./commands/version";

// Plugins
export { default as configPlugin } from "./plugins/config";
export { default as deprecationPlugin } from "./plugins/deprecation";
export { default as dryRunPlugin } from "./plugins/dry-run";
export { default as errorHandlerPlugin } from "./plugins/error-handler";
export { default as helpPlugin } from "./plugins/help";
export { default as verbosePlugin } from "./plugins/verbose";
export { default as versionPlugin } from "./plugins/version";

// Pluginpacks
export { default as basePluginpack } from "./packs/base";
