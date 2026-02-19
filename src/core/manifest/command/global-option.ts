import type { GlobalOptionDefinition } from "~/core/definition/command/global-option";
import { getOptionManifest, type OptionManifest } from "~/core/manifest/command/option";

export interface GlobalOptionManifest extends OptionManifest {}

export function getGlobalOptionManifest(globalOptionDefinition: GlobalOptionDefinition): GlobalOptionManifest {
    // If schema is undefined, create a minimal manifest
    if (!globalOptionDefinition.schema) {
        return {
            name: globalOptionDefinition.name,
        };
    }
    const manifest = getOptionManifest(globalOptionDefinition.name, globalOptionDefinition.schema);
    return manifest;
}
